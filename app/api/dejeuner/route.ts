import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { sameOrigin } from '../../../lib/admin-auth';
import { menuFile, readMenu, type Dish, type Lang } from '../../../lib/menu';
import { lunchCatalog } from '../../../lib/lunch-catalog';
import { allowedDate, euros, lunchAvailable, lunchKind, lunchLinePrice, pickupSlots } from '../../../lib/lunch';
import { mailConfiguration, mailTransport } from '../../../lib/mail';
import { lunchReservationClosedDates, reservationClosedDates } from '../../../lib/reservation-availability';
import { customerLunchMail, lunchLanguage, lunchMessages, type LunchLanguage } from '../../../lib/lunch-localization';
import { checkLunchRateLimit } from '../../../lib/lunch-rate-limit';

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

function replay(record:OrderRecord, fingerprint:string, lang:LunchLanguage) {
  const t=lunchMessages[lang];
  if (record.fingerprint && record.fingerprint!==fingerprint) return NextResponse.json({error:t.mismatch,code:'KEY_MISMATCH',orderNumber:record.orderNumber},{status:409});
  if (record.status==='accepted' || record.emailSent) return NextResponse.json({ok:true,orderNumber:record.orderNumber,confirmationEmailSent:record.confirmationEmailSent ?? true,duplicate:true});
  const pending=record.status==='sending' && Date.now()-Date.parse(record.createdAt)<120000;
  if (!pending && record.restaurantAccepted) return NextResponse.json({ok:true,orderNumber:record.orderNumber,confirmationEmailSent:false,duplicate:true});
  return NextResponse.json({ok:false,pending,orderNumber:record.orderNumber,code:pending?'PENDING':'DELIVERY_UNCERTAIN',error:pending?t.pending:t.uncertain.replace('{order}',record.orderNumber)},{status:pending?202:409,headers:{'Cache-Control':'no-store','Retry-After':'2'}});
}

export async function GET(request:NextRequest) {
  const requestedLang=request.nextUrl.searchParams.get('lang');
  const lang:Lang=requestedLang==='en'||requestedLang==='es'?requestedLang:'fr';
  const menuOnly=request.nextUrl.searchParams.get('availability')==='separate';
  let menu:Dish[], closedDates:string[];
  try { [menu,closedDates]=await Promise.all([readMenu(),menuOnly?Promise.resolve([]):lunchReservationClosedDates()]); }
  catch { return NextResponse.json({error:lunchMessages[lang].availability},{status:503,headers:{'Cache-Control':'no-store'}}); }
  return NextResponse.json({...lunchCatalog(menu,lang),closedDates,availabilityReady:!menuOnly},{headers:{'Cache-Control':'no-store'}});
}

export async function POST(request:NextRequest) {
  let lang=lunchLanguage(request.nextUrl.searchParams.get('lang'));
  let t=lunchMessages[lang];
  if (!sameOrigin(request)) return NextResponse.json({error:t.origin},{status:403});
  if (Number(request.headers.get('content-length')||0)>12000) return NextResponse.json({error:t.tooLarge},{status:413});
  const raw=await request.text().catch(()=>'');
  if (Buffer.byteLength(raw,'utf8')>12000) return NextResponse.json({error:t.tooLarge},{status:413});
  let body:Record<string,unknown>;
  try { const value:unknown=JSON.parse(raw); if (!value || typeof value!=='object' || Array.isArray(value)) throw new Error(); body=value as Record<string,unknown>; }
  catch { return NextResponse.json({error:t.invalidRequest},{status:400}); }
  lang=lunchLanguage(request.nextUrl.searchParams.get('lang') || body.lang);
  t=lunchMessages[lang];
  if (body.website) return NextResponse.json({error:t.invalidRequest},{status:400});
  const key=typeof body.idempotencyKey==='string'?body.idempotencyKey:'';
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key)) return NextResponse.json({error:t.invalidAttempt},{status:400});
  const legacyName=typeof body.name==='string' && typeof body.firstName!=='string';
  const fingerprint=createHash('sha256').update(JSON.stringify(legacyName?[body.name,body.phone,body.email,body.date,body.time,body.comment??'',body.dishes,body.drinks]:[body.firstName,body.lastName,body.phone,body.email,body.date,body.time,body.comment??'',body.dishes,body.drinks])).digest('hex');
  try {
    // Resolve an earlier attempt before consulting mutable menu, clock or SMTP settings.
    const previous=await withState(state=>Object.hasOwn(state.idempotency,key)?state.idempotency[key]:null);
    if (previous) return replay(previous,fingerprint,lang);
    const text=(value:unknown,max:number)=>typeof value==='string' && value.length<=max && !/[\r\n\u0000]/.test(value)?value.trim():'';
    const firstName=text(legacyName?body.name:body.firstName,100), lastName=text(legacyName?'':body.lastName,100), phone=text(body.phone,25), email=text(body.email,254);
    const comment=body.comment===undefined?'':typeof body.comment==='string'?body.comment.replace(/\r\n?/g,'\n').trim():null;
    const date=body.date, time=body.time;
    if (firstName.length<2 || (!legacyName&&lastName.length<2) || !/^[+0-9 ().-]{6,25}$/.test(phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !allowedDate(date) || typeof time!=='string' || !pickupSlots.includes(time) || comment===null || comment.length>1000 || comment.includes('\u0000')) return NextResponse.json({error:t.invalidDetails},{status:400});
    const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim() || 'unknown';
    const limit=await checkLunchRateLimit(path.join(path.dirname(stateFile()),'dejeuner-rate-limit.json'),ip,email);
    if(!limit.allowed)return NextResponse.json({error:t.rateLimited,code:'RATE_LIMITED'},{status:429,headers:{'Retry-After':String(limit.retryAfter),'Cache-Control':'no-store'}});
    try {
      if ((await reservationClosedDates()).includes(date)) return NextResponse.json({code:'RESTAURANT_CLOSED',error:t.closed},{status:409});
    } catch { return NextResponse.json({error:t.availability},{status:503}); }
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
    if (!dishes || !drinks || dishes.length===0) return NextResponse.json({error:t.addDish},{status:400});
    const mainCount=dishes.reduce((n,line)=>n+line.quantity,0), drinkCount=drinks.reduce((n,line)=>n+line.quantity,0);
    const priced=(lines:Line[],kind:'main'|'drink')=>lines.map(line=>{
      const unit=lunchLinePrice(line.dish,kind,mainCount,drinkCount);
      return unit===null?null:{...line,total:unit*line.quantity};
    });
    const pricedDishes=priced(dishes,'main'), pricedDrinks=priced(drinks,'drink');
    if (pricedDishes.some(line=>line===null)||pricedDrinks.some(line=>line===null)) return NextResponse.json({error:t.priceMissing},{status:400});
    const finalDishes=pricedDishes as Line[], finalDrinks=pricedDrinks as Line[];
    const config=mailConfiguration();
    if (!config) return NextResponse.json({error:t.unavailable},{status:503});
    const claim=await withState(state=>{
      if (Object.hasOwn(state.idempotency,key)) return {record:state.idempotency[key],fresh:false};
      const record:OrderRecord={orderNumber:`NO${String(state.nextNumber).padStart(4,'0')}`,fingerprint,createdAt:new Date().toISOString(),status:'sending',confirmationEmailSent:false};
      state.nextNumber++; state.idempotency[key]=record; return {record,fresh:true};
    });
    if (!claim.fresh) return replay(claim.record,fingerprint,lang);
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
        await transport.sendMail({from:config.from,to:email,...customerLunchMail({lang,firstName,orderNumber:number,date,time,dishes:finalDishes,drinks:finalDrinks,total,comment})});
        confirmationEmailSent=true;
      } catch { /* Accepted order remains authoritative; a retry must never resend either mail. */ }
      await withState(state=>{state.idempotency[key].status='accepted';state.idempotency[key].confirmationEmailSent=confirmationEmailSent;});
      return NextResponse.json({ok:true,orderNumber:number,confirmationEmailSent});
    } catch {
      await withState(state=>{state.idempotency[key].status=restaurantSent?'accepted':'uncertain';});
      if (restaurantSent) return NextResponse.json({ok:true,orderNumber:number,confirmationEmailSent:false});
      return NextResponse.json({error:t.uncertain.replace('{order}',number),orderNumber:number,code:'DELIVERY_UNCERTAIN'},{status:502});
    }
  } catch {
    return NextResponse.json({error:t.retry,code:'RETRY_SAME_KEY'},{status:503});
  }
}
