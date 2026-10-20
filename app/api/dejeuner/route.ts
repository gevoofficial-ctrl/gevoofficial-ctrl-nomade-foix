import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { sameOrigin } from '../../../lib/admin-auth';
import { menuFile, readMenu, sortedMenu, type Dish, type Lang, localized } from '../../../lib/menu';
import { allowedDate, euros, lunchAvailable, lunchKind, lunchLinePrice, pickupSlots } from '../../../lib/lunch';
import { mailConfiguration, mailTransport } from '../../../lib/mail';
import { lunchReservationClosedDates, reservationClosedDates } from '../../../lib/reservation-availability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const stateFile = () => process.env.NOMADE_LUNCH_STATE_FILE || path.join(path.dirname(menuFile()), 'dejeuner-orders.json');
type OrderRecord = {
  orderNumber:string; fingerprint:string; createdAt:string;
  status:'sending'|'accepted'|'uncertain'; confirmationEmailSent:boolean;
  restaurantAccepted?:boolean;
  // Recognise earlier technical records without ever sending their emails again.
  emailSent?:boolean;
};
type State = { nextNumber:number; idempotency:Record<string,OrderRecord> };
type Line = { dish:Dish; quantity:number; total:number };

async function withState<T>(change:(state:State)=>T):Promise<T> {
  const target = stateFile();
  await fs.mkdir(path.dirname(target), {recursive:true});
  let lock:fs.FileHandle|undefined;
  for (let i=0; i<60; i++) {
    try { lock=await fs.open(`${target}.lock`,'wx'); break; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; await new Promise(resolve=>setTimeout(resolve,50)); }
  }
  if (!lock) throw new Error('Order service busy');
  try {
    let state:State;
    try { state=JSON.parse(await fs.readFile(target,'utf8')); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; state={nextNumber:1,idempotency:{}}; }
    if (!Number.isSafeInteger(state.nextNumber) || state.nextNumber<1 || !state.idempotency || typeof state.idempotency!=='object' || Array.isArray(state.idempotency)) throw new Error('Invalid order state');
    const result=change(state);
    const temp=`${target}.${crypto.randomUUID()}.tmp`;
    try { await fs.writeFile(temp,JSON.stringify(state)+'\n',{mode:0o600}); await fs.rename(temp,target); }
    finally { await fs.rm(temp,{force:true}); }
    return result;
  } finally { await lock.close(); await fs.rm(`${target}.lock`,{force:true}); }
}

function replay(record:OrderRecord, fingerprint:string) {
  if (record.fingerprint && record.fingerprint!==fingerprint) return NextResponse.json({error:'Cette tentative correspond à une autre commande.',code:'KEY_MISMATCH',orderNumber:record.orderNumber},{status:409});
  if (record.status==='accepted' || record.emailSent) return NextResponse.json({ok:true,orderNumber:record.orderNumber,confirmationEmailSent:record.confirmationEmailSent ?? true,duplicate:true});
  const pending=record.status==='sending' && Date.now()-Date.parse(record.createdAt)<120000;
  if (!pending && record.restaurantAccepted) return NextResponse.json({ok:true,orderNumber:record.orderNumber,confirmationEmailSent:false,duplicate:true});
  return NextResponse.json({ok:false,pending,orderNumber:record.orderNumber,code:pending?'PENDING':'DELIVERY_UNCERTAIN',error:pending?'Envoi en cours…':`L’envoi de la commande ${record.orderNumber} nécessite une vérification. Appelez-nous au 07 45 26 28 23.`},{status:pending?202:409,headers:{'Cache-Control':'no-store','Retry-After':'2'}});
}
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function confirmationHtml(firstName:string, orderNumber:string, date:string, time:string, lines:Line[], total:number, comment:string) {
  const rows=lines.map(line=>`<tr><td style="padding:12px 0;border-bottom:1px solid #dfd5c5">${escapeHtml(line.dish.translations.fr.name)} × ${line.quantity}</td><td style="padding:12px 0;text-align:right;border-bottom:1px solid #dfd5c5">${euros(line.total)}</td></tr>`).join('');
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f1eadf;color:#29241d;font-family:Arial,sans-serif"><table role="presentation" width="100%"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:600px;background:#fffaf2"><tr><td style="padding:32px;background:#17140f;color:#e9e1d1"><p style="letter-spacing:5px;font-size:14px">NOMADE · FOIX</p><h1 style="font-family:Georgia,serif;font-size:34px;font-weight:normal">Déjeuner à emporter</h1><p>Votre commande ${orderNumber} est bien enregistrée.</p></td></tr><tr><td style="padding:32px"><p>Bonjour ${escapeHtml(firstName)},</p><p>Merci pour votre commande et pour votre choix de NOMADE. Vous trouverez ci-dessous le récapitulatif de votre commande.</p><p><strong>Retrait le ${escapeHtml(date)} à ${escapeHtml(time)}</strong><br>42 Rue des Chapeliers · 09000 Foix</p><table width="100%" style="border-collapse:collapse">${rows}<tr><td style="padding:18px 0"><strong>Total</strong></td><td style="text-align:right;font-size:24px">${euros(total)}</td></tr></table>${comment?`<p><strong>Commentaire</strong><br>${escapeHtml(comment).replace(/\n/g,'<br>')}</p>`:''}<p style="padding:16px;background:#f1eadf">Le règlement sera effectué sur place le jour du retrait.</p><p>Nous vous attendons avec plaisir chez NOMADE.<br>À très bientôt.</p></td></tr></table></td></tr></table></body></html>`;
}

export async function GET(request:NextRequest) {
  const requestedLang=request.nextUrl.searchParams.get('lang');
  const lang:Lang=requestedLang==='en'||requestedLang==='es'?requestedLang:'fr';
  let menu:Dish[], closedDates:string[];
  try { [menu,closedDates]=await Promise.all([readMenu(),lunchReservationClosedDates()]); }
  catch { return NextResponse.json({error:'Availability is temporarily unavailable'},{status:503,headers:{'Cache-Control':'no-store'}}); }
  menu=sortedMenu(menu).filter(lunchAvailable);
  const item=(dish:Dish)=>{
    const text=localized(dish,lang);
    return {id:dish.id,name:text.name,description:text.description,imageUrl:dish.imageUrl,regularPriceCents:dish.regularPriceCents,lunchPriceCents:dish.lunchPriceCents};
  };
  return NextResponse.json({dishes:menu.filter(d=>lunchKind(d)==='main').map(item),drinks:menu.filter(d=>lunchKind(d)==='drink').map(item),pickupSlots,closedDates},{headers:{'Cache-Control':'no-store'}});
}

export async function POST(request:NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({error:'Invalid origin'},{status:403});
  if (Number(request.headers.get('content-length')||0)>12000) return NextResponse.json({error:'Request too large'},{status:413});
  const raw=await request.text().catch(()=>'');
  if (Buffer.byteLength(raw,'utf8')>12000) return NextResponse.json({error:'Request too large'},{status:413});
  let body:Record<string,unknown>;
  try { const value:unknown=JSON.parse(raw); if (!value || typeof value!=='object' || Array.isArray(value)) throw new Error(); body=value as Record<string,unknown>; }
  catch { return NextResponse.json({error:'Requête invalide.'},{status:400}); }
  if (body.website) return NextResponse.json({error:'Requête invalide.'},{status:400});
  const key=typeof body.idempotencyKey==='string'?body.idempotencyKey:'';
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key)) return NextResponse.json({error:'Identifiant de tentative invalide.'},{status:400});
  const legacyName=typeof body.name==='string' && typeof body.firstName!=='string';
  const fingerprint=createHash('sha256').update(JSON.stringify(legacyName?[body.name,body.phone,body.email,body.date,body.time,body.comment??'',body.dishes,body.drinks]:[body.firstName,body.lastName,body.phone,body.email,body.date,body.time,body.comment??'',body.dishes,body.drinks])).digest('hex');
  try {
    // Resolve an earlier attempt before consulting mutable menu, clock or SMTP settings.
    const previous=await withState(state=>Object.hasOwn(state.idempotency,key)?state.idempotency[key]:null);
    if (previous) return replay(previous,fingerprint);
    const text=(value:unknown,max:number)=>typeof value==='string' && value.length<=max && !/[\r\n\u0000]/.test(value)?value.trim():'';
    const firstName=text(legacyName?body.name:body.firstName,100), lastName=text(legacyName?'':body.lastName,100), phone=text(body.phone,25), email=text(body.email,254);
    const comment=body.comment===undefined?'':typeof body.comment==='string'?body.comment.replace(/\r\n?/g,'\n').trim():null;
    const date=body.date, time=body.time;
    if (firstName.length<2 || (!legacyName&&lastName.length<2) || !/^[+0-9 ().-]{6,25}$/.test(phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !allowedDate(date) || typeof time!=='string' || !pickupSlots.includes(time) || comment===null || comment.length>1000 || comment.includes('\u0000')) return NextResponse.json({error:'Veuillez vérifier les informations de commande.'},{status:400});
    try {
      if ((await reservationClosedDates()).includes(date)) return NextResponse.json({code:'RESTAURANT_CLOSED',error:'Le restaurant est fermé à cette date.'},{status:409});
    } catch { return NextResponse.json({error:'La disponibilité est momentanément indisponible. Réessayez plus tard ou appelez-nous au 07 45 26 28 23.'},{status:503}); }
    const menu=new Map((await readMenu()).map(d=>[d.id,d]));
    const parseLines=(value:unknown,kind:'main'|'drink'):Line[]|null=>{
      if (!Array.isArray(value) || value.length>100) return null;
      const seen=new Set<string>(); const lines:Line[]=[];
      for (const entry of value) {
        if (!entry || typeof entry!=='object') return null;
        const item=entry as Record<string,unknown>, dish=menu.get(String(item.id));
        if (!dish || seen.has(dish.id) || !lunchAvailable(dish) || lunchKind(dish)!==kind || !Number.isInteger(item.quantity) || (item.quantity as number)<1 || (item.quantity as number)>999) return null;
        seen.add(dish.id); lines.push({dish,quantity:item.quantity as number,total:0});
      }
      return lines;
    };
    const dishes=parseLines(body.dishes,'main'), drinks=parseLines(body.drinks,'drink');
    if (!dishes || !drinks || dishes.length===0) return NextResponse.json({error:'Ajoutez au moins un plat à votre commande.'},{status:400});
    const itemCount=[...dishes,...drinks].reduce((n,line)=>n+line.quantity,0);
    const priced=(lines:Line[])=>lines.map(line=>{
      const unit=lunchLinePrice(line.dish,itemCount);
      return unit===null?null:{...line,total:unit*line.quantity};
    });
    const pricedDishes=priced(dishes), pricedDrinks=priced(drinks);
    if (pricedDishes.some(line=>line===null)||pricedDrinks.some(line=>line===null)) return NextResponse.json({error:'Les prix habituels de cette sélection seront bientôt disponibles. Ajoutez-les dans l’administration pour commander jusqu’à 3 articles.'},{status:400});
    const finalDishes=pricedDishes as Line[], finalDrinks=pricedDrinks as Line[];
    const config=mailConfiguration();
    if (!config) return NextResponse.json({error:'Le service est temporairement indisponible. Appelez-nous au 07 45 26 28 23.'},{status:503});
    const claim=await withState(state=>{
      if (Object.hasOwn(state.idempotency,key)) return {record:state.idempotency[key],fresh:false};
      const record:OrderRecord={orderNumber:`NO${String(state.nextNumber).padStart(4,'0')}`,fingerprint,createdAt:new Date().toISOString(),status:'sending',confirmationEmailSent:false};
      state.nextNumber++; state.idempotency[key]=record; return {record,fresh:true};
    });
    if (!claim.fresh) return replay(claim.record,fingerprint);
    const number=claim.record.orderNumber, all=[...finalDishes,...finalDrinks], total=all.reduce((n,line)=>n+line.total,0);
    const lineText=(lines:Line[])=>lines.length?lines.map(line=>`- ${line.dish.translations.fr.name} × ${line.quantity} — ${euros(line.total)}`).join('\n'):'- Aucun';
    const summary=`Date de retrait : ${date}\nHeure : ${time} (Europe/Paris)\n\nPlats :\n${lineText(finalDishes)}\n\nBoissons :\n${lineText(finalDrinks)}\n\n${comment?`Commentaire : ${comment}\n`:''}Total : ${euros(total)}\n\nLe règlement sera effectué sur place le jour du retrait.`;
    let restaurantSent=false, confirmationEmailSent=false;
    try {
      const transport=mailTransport(config);
      const customerDetails=legacyName?`Nom : ${firstName}`:`Prénom : ${firstName}\nNom : ${lastName}`;
      await transport.sendMail({from:config.from,to:config.to,replyTo:email,subject:`[LUNCH] ${number} — Nouvelle commande`,text:`Commande ${number}\n\n${customerDetails}\nTéléphone : ${phone}\nE-mail : ${email}\n\n${summary}`});
      restaurantSent=true;
      // Persist restaurant acceptance before the optional customer delivery.
      await withState(state=>{state.idempotency[key].restaurantAccepted=true;});
      try {
        await transport.sendMail({from:config.from,to:email,subject:`Confirmation de votre commande ${number} — NOMADE`,text:`Bonjour ${firstName},\n\nVotre commande ${number} est bien enregistrée.\n\nMerci pour votre commande et pour votre choix de NOMADE.\nVous trouverez ci-dessous le récapitulatif de votre commande.\n\n${summary}\n\nNous vous attendons avec plaisir chez NOMADE.\nÀ très bientôt.`,html:confirmationHtml(firstName,number,date,time,all,total,comment)});
        confirmationEmailSent=true;
      } catch { /* Accepted order remains authoritative; a retry must never resend either mail. */ }
      await withState(state=>{state.idempotency[key].status='accepted';state.idempotency[key].confirmationEmailSent=confirmationEmailSent;});
      return NextResponse.json({ok:true,orderNumber:number,confirmationEmailSent});
    } catch {
      await withState(state=>{state.idempotency[key].status=restaurantSent?'accepted':'uncertain';});
      if (restaurantSent) return NextResponse.json({ok:true,orderNumber:number,confirmationEmailSent:false});
      return NextResponse.json({error:`L’envoi de la commande ${number} nécessite une vérification. Appelez-nous au 07 45 26 28 23.`,orderNumber:number,code:'DELIVERY_UNCERTAIN'},{status:502});
    }
  } catch {
    return NextResponse.json({error:'Service temporairement indisponible. Conservez votre tentative et réessayez.',code:'RETRY_SAME_KEY'},{status:503});
  }
}
