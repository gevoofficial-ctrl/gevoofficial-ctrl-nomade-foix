'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { allowedDate, euros, hasLunchSpecialPrice, nextPickupDate } from '../../lib/lunch';

type Item = { id:string; name:string; description:string; imageUrl:string; regularPriceCents:number|null; lunchPriceCents:number|null };
type Lang = 'fr'|'en'|'es';
const copy = {
  fr:{eyebrow:'À EMPORTER · MIDI',title:'Déjeuner à emporter',intro:'Composez votre déjeuner à emporter. Dès 4 plats ou 4 boissons, le prix spécial s’applique à toutes les positions du panier.',dishes:'Les plats',drinks:'Les boissons',date:'Date de retrait',time:'Heure de retrait',firstName:'Prénom',lastName:'Nom',phone:'Téléphone',email:'E-mail',comment:'Commentaire ou demande particulière',send:'Envoyer la commande',sending:'Envoi en cours…',choose:'Choisissez vos plats pour commencer.',regular:'Prix habituel',special:'Prix spécial appliqué à toutes les positions dès 4 plats ou 4 boissons.',priceSoon:'Prix habituel bientôt disponible',priceMissing:'Le prix habituel de cette sélection sera bientôt disponible. Dès 4 plats ou 4 boissons, le prix spécial s’applique à toutes les positions.',pickup:'Retrait chez NOMADE · 12h00–14h00 · paiement sur place',success:'Votre commande {order} a bien été envoyée. Un récapitulatif vous a été envoyé par e-mail.',noEmail:'Votre commande {order} est enregistrée. L’e-mail de confirmation n’a pas pu être envoyé. Pour toute question, appelez-nous au 07 45 26 28 23.',unavailable:'Le service est momentanément indisponible. Réessayez ou appelez-nous au 07 45 26 28 23.',empty:'Les plats du déjeuner seront bientôt disponibles.',previous:'Plats précédents',next:'Plats suivants',previousMonth:'Mois précédent',nextMonth:'Mois suivant',total:'Total',chooseDate:'Choisir une date',chooseTime:'Choisir une heure',dates:'Du lundi au vendredi. Commandez pour aujourd’hui entre 09h30 et 11h30, heure de France. Les jours suivants restent disponibles.',invalidDate:'Choisissez un jour ouvré disponible. Pour aujourd’hui, les commandes ouvrent à 09h30 et ferment à 11h30.',closedDate:'Le restaurant est fermé à cette date. Choisissez un autre jour.',payment:'Le règlement sera effectué sur place le jour du retrait.',privacy:'Vos coordonnées servent uniquement à gérer votre commande.',policy:'Confidentialité',retry:'Vérifier / reprendre cet envoi',pending:'Votre envoi est en cours de vérification. Réessayez avec cette même tentative.',newOrder:'Préparer une nouvelle commande',loading:'Chargement du déjeuner…',add:'Ajouter',remove:'Retirer',restored:'Votre tentative a été conservée. Reprenez cet envoi pour vérifier son résultat.',weekdays:['Lu','Ma','Me','Je','Ve','Sa','Di']},
  en:{eyebrow:'TAKEAWAY · LUNCH',title:'Takeaway lunch',intro:'Build your takeaway lunch. From 4 mains or 4 drinks, the special price applies to every cart item.',dishes:'Mains',drinks:'Drinks',date:'Pickup date',time:'Pickup time',firstName:'First name',lastName:'Last name',phone:'Phone',email:'Email',comment:'Comment or special request',send:'Send order',sending:'Sending…',choose:'Choose your dishes to begin.',regular:'Regular price',special:'Special price applied to every cart item from 4 mains or 4 drinks.',priceSoon:'Regular price coming soon',priceMissing:'The regular price for this selection will be available soon. From 4 mains or 4 drinks, the special price applies to every cart item.',pickup:'Pickup at NOMADE · 12:00–14:00 · pay on site',success:'Your order {order} has been sent. A summary was emailed to you.',noEmail:'Your order {order} is registered, but the confirmation email could not be sent. Call +33 7 45 26 28 23 with any questions.',unavailable:'The service is temporarily unavailable. Retry or call +33 7 45 26 28 23.',empty:'Lunch dishes will be available soon.',previous:'Previous dishes',next:'Next dishes',previousMonth:'Previous month',nextMonth:'Next month',total:'Total',chooseDate:'Choose a date',chooseTime:'Choose a time',dates:'Monday to Friday. Same-day orders open 09:30–11:30, French time. Future weekdays remain available.',invalidDate:'Choose an available weekday. Same-day orders open 09:30–11:30, French time.',closedDate:'The restaurant is closed on this date. Choose another day.',payment:'Payment will be made on site on the pickup day.',privacy:'Your contact details are used only to manage your order.',policy:'Privacy',retry:'Check / resume this submission',pending:'Your submission is still being checked. Retry this same attempt.',newOrder:'Prepare a new order',loading:'Loading lunch…',add:'Add',remove:'Remove',restored:'Your attempt was saved. Resume it to check the result.',weekdays:['Mo','Tu','We','Th','Fr','Sa','Su']},
  es:{eyebrow:'PARA LLEVAR · MEDIODÍA',title:'Almuerzo para llevar',intro:'Compón tu almuerzo para llevar. A partir de 4 platos o 4 bebidas, el precio especial se aplica a todas las posiciones de la cesta.',dishes:'Platos',drinks:'Bebidas',date:'Fecha de recogida',time:'Hora de recogida',firstName:'Nombre',lastName:'Apellidos',phone:'Teléfono',email:'Correo electrónico',comment:'Comentario o solicitud especial',send:'Enviar pedido',sending:'Enviando…',choose:'Elige tus platos para empezar.',regular:'Precio habitual',special:'Precio especial aplicado a todas las posiciones desde 4 platos o 4 bebidas.',priceSoon:'Precio habitual próximamente',priceMissing:'El precio habitual de esta selección estará disponible pronto. A partir de 4 platos o 4 bebidas, el precio especial se aplica a todas las posiciones.',pickup:'Recogida en NOMADE · 12:00–14:00 · pago en el local',success:'Tu pedido {order} se ha enviado. Te hemos enviado un resumen por correo.',noEmail:'Tu pedido {order} está registrado, pero no se pudo enviar el correo. Llámanos al +33 7 45 26 28 23.',unavailable:'El servicio no está disponible temporalmente. Reintenta o llama al +33 7 45 26 28 23.',empty:'Los platos del almuerzo estarán disponibles pronto.',previous:'Platos anteriores',next:'Platos siguientes',previousMonth:'Mes anterior',nextMonth:'Mes siguiente',total:'Total',chooseDate:'Elegir una fecha',chooseTime:'Elegir una hora',dates:'De lunes a viernes. Pedidos para hoy de 09:30 a 11:30, hora de Francia. Los próximos días laborables siguen disponibles.',invalidDate:'Elige un día laborable disponible. Para hoy, los pedidos abren de 09:30 a 11:30.',closedDate:'El restaurante está cerrado en esta fecha. Elige otro día.',payment:'El pago se realizará en el local el día de la recogida.',privacy:'Tus datos se utilizan únicamente para gestionar el pedido.',policy:'Privacidad',retry:'Comprobar / reanudar este envío',pending:'El envío se está comprobando. Reintenta con el mismo intento.',newOrder:'Preparar otro pedido',loading:'Cargando almuerzo…',add:'Añadir',remove:'Quitar',restored:'Tu intento se ha conservado. Reanúdalo para comprobar el resultado.',weekdays:['Lu','Ma','Mi','Ju','Vi','Sá','Do']},
};
type Labels = typeof copy.fr;
type Fields = {firstName:string;lastName:string;phone:string;email:string;comment:string};
type Payload = Fields & {idempotencyKey:string;date:string;time:string;dishes:{id:string;quantity:number}[];drinks:{id:string;quantity:number}[]};
type Receipt = {orderNumber:string;confirmationEmailSent:boolean};
type Draft = {quantities:Record<string,number>;fields:Fields;date:string;time:string;attempt:Payload|null;receipt:Receipt|null};
const storageKey='nomade-dejeuner-v2';
const locales = {fr:'fr-FR',en:'en-GB',es:'es-ES'} as const;
const blankFields=():Fields=>({firstName:'',lastName:'',phone:'',email:'',comment:''});
const isoDate=(year:number,month:number,day:number)=>`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
const parseIso=(value:string)=>{const [year,month,day]=value.split('-').map(Number);return new Date(year,month-1,day);};
function calendarCells(year:number,month:number) { const offset=(new Date(year,month,1).getDay()+6)%7; const days=new Date(year,month+1,0).getDate(); return [...Array(offset).fill(null),...Array.from({length:days},(_,index)=>index+1)]; }

function ItemRail({title,id,items,quantities,onQuantity,t,disabled,mainCount,drinkCount}:{title:string;id:string;items:Item[];quantities:Record<string,number>;onQuantity:(id:string,delta:number)=>void;t:Labels;disabled:boolean;mainCount:number;drinkCount:number}) {
  const rail=useRef<HTMLDivElement>(null);
  const special=hasLunchSpecialPrice(mainCount,drinkCount);
  return <section className="lunchGroup" aria-labelledby={`${id}-title`}>
    <div className="lunchGroupHead"><h2 id={`${id}-title`}>{title}</h2>{items.length>4&&<div className="lunchRailControls"><button type="button" aria-label={t.previous} onClick={()=>rail.current?.scrollBy({left:-320,behavior:'smooth'})}>←</button><button type="button" aria-label={t.next} onClick={()=>rail.current?.scrollBy({left:320,behavior:'smooth'})}>→</button></div>}</div>
    <div className={`lunchRail${items.length<=4?' lunchRailShort':''}`} ref={rail} tabIndex={items.length>4?0:undefined} aria-label={title}>
      {items.map(item=>{const price=special?item.lunchPriceCents:item.regularPriceCents;return <article className="lunchCard" key={item.id}>
        <div className="lunchCardImage">{item.imageUrl&&<Image src={item.imageUrl} alt={item.name} fill sizes="(max-width:800px) 78vw, 280px"/>}</div>
        <div className="lunchCardBody"><h3>{item.name}</h3>{item.description&&<p>{item.description}</p>}<div className="lunchPrice"><span>{special?t.special:t.regular}</span><strong>{price===null?t.priceSoon:euros(price)}</strong></div>
          <div className="quantity"><button type="button" aria-label={`${t.remove} ${item.name}`} disabled={disabled||!quantities[item.id]} onClick={()=>onQuantity(item.id,-1)}>−</button><output aria-live="polite" key={quantities[item.id]||0}>{quantities[item.id]||0}</output><button type="button" aria-label={`${t.add} ${item.name}`} disabled={disabled||(quantities[item.id]||0)>=999} onClick={()=>onQuantity(item.id,1)}>+</button></div>
        </div>
      </article>;})}
    </div>
  </section>;
}

function LunchLoading({label}:{label:string}) {
  return <section className="lunchLoading" role="status" aria-label={label}>
    <span className="srOnly">{label}</span>
    <div aria-hidden="true">
      <div className="lunchLoadingBrand"><Image src="/nomade-logo-light.svg" alt="" width={120} height={41} /><span /></div>
      <div className="lunchGroupHead"><div className="lunchSkeleton lunchSkeletonHeading" /></div>
      <div className="lunchRail lunchRailShort lunchSkeletonRail">
        {[0,1,2].map(index=><div className="lunchCard lunchSkeletonCard" key={index}>
          <div className="lunchCardImage lunchSkeleton" />
          <div className="lunchCardBody"><div className="lunchSkeleton lunchSkeletonTitle" /><div className="lunchSkeletonDescription"><span className="lunchSkeleton" /><span className="lunchSkeleton" /></div><div className="lunchSkeleton lunchSkeletonPrice" /><div className="lunchSkeleton lunchSkeletonQuantity" /></div>
        </div>)}
      </div>
    </div>
  </section>;
}

export default function DejeunerForm({lang}:{lang:Lang}) {
  const t=copy[lang];
  const initialDate=nextPickupDate();
  const initialMonth=parseIso(initialDate);
  const [items,setItems]=useState<{dishes:Item[];drinks:Item[];pickupSlots:string[];closedDates:string[]}>({dishes:[],drinks:[],pickupSlots:[],closedDates:[]});
  const [quantities,setQuantities]=useState<Record<string,number>>({});
  const [fields,setFields]=useState<Fields>(blankFields);
  const [date,setDate]=useState(initialDate);
  const [time,setTime]=useState('');
  const [attempt,setAttempt]=useState<Payload|null>(null);
  const [receipt,setReceipt]=useState<Receipt|null>(null);
  const [status,setStatus]=useState('');
  const [busy,setBusy]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [menuError,setMenuError]=useState(false);
  const [menuRequest,setMenuRequest]=useState(0);
  const [restored,setRestored]=useState(false);
  const [,tick]=useState(0);
  const [dateOpen,setDateOpen]=useState(false);
  const [timeOpen,setTimeOpen]=useState(false);
  const [view,setView]=useState({year:initialMonth.getFullYear(),month:initialMonth.getMonth()});
  const pickerRef=useRef<HTMLFieldSetElement>(null);
  const sending=useRef(false);
  useEffect(()=>{const restoreFrame=requestAnimationFrame(()=>{try {const saved=sessionStorage.getItem(storageKey);if(saved){const draft=JSON.parse(saved) as Draft;if(draft.fields&&typeof draft.date==='string'&&draft.quantities){setQuantities(draft.quantities);setFields(draft.fields);setDate(draft.date);setTime(draft.time||'');setAttempt(draft.attempt||null);setReceipt(draft.receipt||null);if(draft.attempt)setStatus(t.restored);}}}catch{}setRestored(true);});const timer=setInterval(()=>tick(n=>n+1),30000);return()=>{cancelAnimationFrame(restoreFrame);clearInterval(timer);};},[t.restored]);
  useEffect(()=>{let active=true;const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);fetch(`/api/dejeuner?lang=${lang}`,{cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error();return response.json();}).then(body=>{if(!Array.isArray(body.dishes)||!Array.isArray(body.drinks)||!Array.isArray(body.pickupSlots)||!Array.isArray(body.closedDates))throw new Error();const closedDates=body.closedDates.filter((value:unknown):value is string=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value));if(active){setItems({...body,closedDates});setDate(current=>allowedDate(current)&&!closedDates.includes(current)?current:nextPickupDate(new Date(),closedDates));}}).catch(()=>{if(active)setMenuError(true);}).finally(()=>{clearTimeout(timeout);if(active)setLoaded(true);});return()=>{active=false;clearTimeout(timeout);controller.abort();};},[lang,menuRequest]);
  useEffect(()=>{const close=(event:PointerEvent)=>{if(pickerRef.current&&!pickerRef.current.contains(event.target as Node)){setDateOpen(false);setTimeOpen(false);}};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
  useEffect(()=>{if(!restored)return;try{sessionStorage.setItem(storageKey,JSON.stringify({quantities,fields,date,time,attempt,receipt} satisfies Draft));}catch{}},[quantities,fields,date,time,attempt,receipt,restored]);
  const mainCount=items.dishes.reduce((sum,item)=>sum+(quantities[item.id]||0),0);
  const drinkCount=items.drinks.reduce((sum,item)=>sum+(quantities[item.id]||0),0);
  const itemCount=mainCount+drinkCount;
  const special=hasLunchSpecialPrice(mainCount,drinkCount);
  const selected=[...items.dishes.map(item=>({item,kind:'main' as const})),...items.drinks.map(item=>({item,kind:'drink' as const}))].filter(({item})=>quantities[item.id]);
  const priceFor=({item}:{item:Item;kind:'main'|'drink'})=>special?item.lunchPriceCents:item.regularPriceCents;
  const hasPrices=selected.length>0&&selected.every(entry=>priceFor(entry)!==null);
  const total=selected.reduce((sum,entry)=>sum+(priceFor(entry)??0)*(quantities[entry.item.id]||0),0);
  const locked=busy||Boolean(attempt)||Boolean(receipt);
  const dateAvailable=(value:string)=>allowedDate(value)&&!items.closedDates.includes(value);
  const dateLabel=new Intl.DateTimeFormat(locales[lang],{day:'2-digit',month:'long',year:'numeric'}).format(parseIso(date));
  const monthLabel=new Intl.DateTimeFormat(locales[lang],{month:'long',year:'numeric'}).format(new Date(view.year,view.month,1));
  const onQuantity=(id:string,delta:number)=>setQuantities(current=>({...current,[id]:Math.max(0,Math.min(999,(current[id]||0)+delta))}));
  const setField=(key:keyof Fields,value:string)=>setFields(current=>({...current,[key]:value}));
  const chooseDate=(value:string)=>{if(!dateAvailable(value)){setStatus(items.closedDates.includes(value)?t.closedDate:t.invalidDate);return;}setDate(value);setStatus('');setDateOpen(false);};
  const changeMonth=(delta:number)=>{const next=new Date(view.year,view.month+delta,1);if(next<new Date(initialMonth.getFullYear(),initialMonth.getMonth(),1))return;setView({year:next.getFullYear(),month:next.getMonth()});};

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(sending.current||receipt)return;if(!attempt&&(!selected.some(entry=>entry.kind==='main')||!hasPrices||!dateAvailable(date)||!time)){if(items.closedDates.includes(date))setStatus(t.closedDate);else if(!hasPrices&&selected.length)setStatus(t.priceMissing);return;}
    sending.current=true;setBusy(true);setStatus('');const payload:Payload=attempt||{...fields,idempotencyKey:crypto.randomUUID(),date,time,dishes:items.dishes.filter(item=>quantities[item.id]).map(item=>({id:item.id,quantity:quantities[item.id]})),drinks:items.drinks.filter(item=>quantities[item.id]).map(item=>({id:item.id,quantity:quantities[item.id]}))};
    setAttempt(payload);try{sessionStorage.setItem(storageKey,JSON.stringify({quantities,fields,date,time,attempt:payload,receipt:null} satisfies Draft));}catch{}
    try {const response=await fetch('/api/dejeuner',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const body=await response.json();if(response.ok&&body.ok&&typeof body.orderNumber==='string'){const result={orderNumber:body.orderNumber,confirmationEmailSent:body.confirmationEmailSent!==false};setReceipt(result);setAttempt(null);setQuantities({});setFields(blankFields());setTime('');try{sessionStorage.setItem(storageKey,JSON.stringify({quantities:{},fields:blankFields(),date,time:'',attempt:null,receipt:result} satisfies Draft));}catch{}}else if(response.status===202&&body.pending)setStatus(`${t.pending}${body.orderNumber?` (${body.orderNumber})`:''}`);else{if((response.status===400||response.status===413)&&!body.orderNumber)setAttempt(null);setStatus(typeof body.error==='string'?body.error:t.unavailable);}}catch{setStatus(t.pending);}finally{sending.current=false;setBusy(false);}
  }
  function newOrder(){setReceipt(null);setAttempt(null);setStatus('');setDate(nextPickupDate(new Date(),items.closedDates));setQuantities({});setFields(blankFields());setTime('');try{sessionStorage.removeItem(storageKey);}catch{}}
  const summaryMessage=attempt?t.restored:itemCount===0?t.choose:special?t.special:hasPrices?t.regular:t.priceMissing;
  return <main className="dejeunerPage printSection" lang={lang}>
    <header className="dejeunerHero"><Link className="textLink" href={`/${lang}`}>← NOMADE · FOIX</Link><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p className="lead">{t.intro}</p><p className="dejeunerPickup">{t.pickup}</p><nav className="menuLanguageSwitcher" aria-label="Language">{(['fr','en','es'] as const).map(language=><Link key={language} href={`/${language}/dejeuner`} aria-current={lang===language?'page':undefined}>{language.toUpperCase()}</Link>)}</nav></header>
    {receipt?<section className="lunchReceipt" role="status"><p>{(receipt.confirmationEmailSent?t.success:t.noEmail).replace('{order}',receipt.orderNumber)}</p><button className="button" onClick={newOrder}>{t.newOrder}</button></section>:<>
      {!loaded&&<LunchLoading label={t.loading} />}
      {loaded&&menuError&&<div className="dejeunerEmpty lunchLoadError" role="status"><p>{t.unavailable}</p><button type="button" className="button" onClick={()=>{setMenuError(false);setLoaded(false);setMenuRequest(value=>value+1);}}>{lang==='fr'?'Réessayer':lang==='en'?'Try again':'Reintentar'}</button></div>}
      {loaded&&!menuError&&items.dishes.length===0&&!attempt&&<p className="dejeunerEmpty">{status||t.empty}</p>}
      {loaded&&((!menuError&&items.dishes.length>0)||attempt)&&<form className="dejeunerForm lunchMenuReady" onSubmit={submit}>
        <ItemRail title={t.dishes} id="lunch-mains" items={items.dishes} quantities={quantities} onQuantity={onQuantity} t={t} disabled={locked} mainCount={mainCount} drinkCount={drinkCount} />
        {items.drinks.length>0&&<ItemRail title={t.drinks} id="lunch-drinks" items={items.drinks} quantities={quantities} onQuantity={onQuantity} t={t} disabled={locked} mainCount={mainCount} drinkCount={drinkCount} />}
        <section className="dejeunerCheckout"><fieldset className="dejeunerFields" ref={pickerRef} disabled={locked} onKeyDown={event=>{if(event.key==='Escape'){setDateOpen(false);setTimeOpen(false);}}}><legend className="srOnly">{t.title}</legend>
          <label>{t.firstName}<input name="firstName" value={fields.firstName} onChange={event=>setField('firstName',event.target.value)} autoComplete="given-name" required minLength={2} maxLength={100}/></label>
          <label>{t.lastName}<input name="lastName" value={fields.lastName} onChange={event=>setField('lastName',event.target.value)} autoComplete="family-name" required minLength={2} maxLength={100}/></label>
          <label>{t.phone}<input name="phone" value={fields.phone} onChange={event=>setField('phone',event.target.value)} type="tel" autoComplete="tel" required minLength={6} maxLength={25}/></label>
          <label className="emailField">{t.email}<input name="email" value={fields.email} onChange={event=>setField('email',event.target.value)} type="email" autoComplete="email" required maxLength={254}/></label>
          <div className={`pickerField lunchPicker ${dateOpen?'isOpen':''}`}><label>{t.date}</label><input name="date" type="hidden" value={date} required readOnly/><button type="button" className={`pickerTrigger ${date?'hasValue':''}`} aria-haspopup="dialog" aria-expanded={dateOpen} onClick={()=>{setDateOpen(value=>!value);setTimeOpen(false);}}>{dateLabel}<span aria-hidden="true">⌄</span></button>{dateOpen&&<div className="datePicker pickerPopover" role="dialog" aria-label={t.chooseDate}><div className="pickerHead"><button type="button" aria-label={t.previousMonth} onClick={()=>changeMonth(-1)} disabled={view.year===initialMonth.getFullYear()&&view.month===initialMonth.getMonth()}>‹</button><strong>{monthLabel}</strong><button type="button" aria-label={t.nextMonth} onClick={()=>changeMonth(1)}>›</button></div><div className="weekdays">{t.weekdays.map(day=><span key={day}>{day}</span>)}</div><div className="calendarGrid">{calendarCells(view.year,view.month).map((day,index)=>{if(!day)return <span key={`blank-${index}`}/>;const value=isoDate(view.year,view.month,day);return <button key={value} type="button" disabled={!dateAvailable(value)} className={value===date?'selected':''} onClick={()=>chooseDate(value)}>{day}</button>;})}</div></div>}<small>{t.dates}</small>{!dateAvailable(date)&&<small role="alert">{items.closedDates.includes(date)?t.closedDate:t.invalidDate}</small>}</div>
          <div className={`pickerField lunchPicker ${timeOpen?'isOpen':''}`}><label>{t.time}</label><input name="time" type="hidden" value={time} required readOnly/><button type="button" className={`pickerTrigger ${time?'hasValue':''}`} aria-haspopup="listbox" aria-expanded={timeOpen} onClick={()=>{setTimeOpen(value=>!value);setDateOpen(false);}}>{time||t.chooseTime}<span aria-hidden="true">⌄</span></button>{timeOpen&&<div className="timePicker pickerPopover" role="listbox" aria-label={t.chooseTime}>{items.pickupSlots.map(slot=><button key={slot} type="button" role="option" aria-selected={slot===time} className={slot===time?'selected':''} onClick={()=>{setTime(slot);setTimeOpen(false);}}>{slot}</button>)}</div>}</div>
          <label className="commentField">{t.comment}<textarea name="comment" value={fields.comment} onChange={event=>setField('comment',event.target.value)} maxLength={1000} rows={3}/></label>
        </fieldset><div className="dejeunerSummary"><p className={special?'ready':itemCount?'needsMore':''}>{summaryMessage}</p><div><span>{t.total}</span><strong>{loaded&&hasPrices?euros(total):'—'}</strong></div><p>{t.payment}</p><button className="button" type="submit" disabled={busy||(!attempt&&(!selected.some(entry=>entry.kind==='main')||!hasPrices||!dateAvailable(date)||!time))}>{busy?t.sending:attempt?t.retry:t.send}</button>{status&&<p className="dejeunerStatus" role="status">{status}</p>}</div></section>
        <p className="muted">{t.privacy} <Link href={`/${lang}/confidentialite`}>{t.policy}</Link></p>
      </form>}
    </>}</main>;
}
