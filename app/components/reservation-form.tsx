'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { Lang } from '../../lib/menu';
import { reservationTimeSlots } from '../../lib/reservation-times';

const copy = {
  fr: { title:'Votre table chez NOMADE', intro:'Réservez votre table. Une confirmation vous sera adressée par e-mail.', name:'Nom', phone:'Téléphone', email:'E-mail', date:'Date', time:'Heure', guests:'Nombre de personnes', send:'Confirmer la réservation', sending:'Envoi…', success:'Votre réservation est confirmée. Un e-mail de confirmation vient de vous être envoyé.', emailWarning:'Votre réservation est confirmée, mais l’e-mail de confirmation n’a pas pu être envoyé. Appelez-nous au 07 45 26 28 23 si nécessaire.', error:'Impossible d’envoyer la réservation. Appelez-nous au 07 45 26 28 23.', pastDate:'Choisissez une date à partir d’aujourd’hui.', closed:'Le restaurant est fermé ce jour. Choisissez une autre date.', privacy:'Vos coordonnées servent uniquement à gérer votre réservation.', policy:'Confidentialité', chooseDate:'Choisir une date', chooseTime:'Choisir une heure', weekdays:['Lu','Ma','Me','Je','Ve','Sa','Di'] },
  en: { title:'Your table at NOMADE', intro:'Book your table. A confirmation will be sent to you by email.', name:'Name', phone:'Phone number', email:'Email', date:'Date', time:'Time', guests:'Number of guests', send:'Confirm booking', sending:'Sending…', success:'Your booking is confirmed. A confirmation email has been sent to you.', emailWarning:'Your booking is confirmed, but the confirmation email could not be sent. Call us on +33 7 45 26 28 23 if needed.', error:'Unable to send your booking. Call us on +33 7 45 26 28 23.', pastDate:'Choose today or a future date.', closed:'The restaurant is closed on this date. Please choose another day.', privacy:'We use your contact details only to manage your booking.', policy:'Privacy policy', chooseDate:'Choose a date', chooseTime:'Choose a time', weekdays:['Mo','Tu','We','Th','Fr','Sa','Su'] },
  es: { title:'Tu mesa en NOMADE', intro:'Reserva tu mesa. Recibirás una confirmación por correo electrónico.', name:'Nombre', phone:'Teléfono', email:'Correo electrónico', date:'Fecha', time:'Hora', guests:'Número de personas', send:'Confirmar reserva', sending:'Enviando…', success:'Tu reserva está confirmada. Te hemos enviado un correo electrónico de confirmación.', emailWarning:'Tu reserva está confirmada, pero no se pudo enviar el correo de confirmación. Llámanos al +33 7 45 26 28 23 si lo necesitas.', error:'No se pudo enviar la reserva. Llámanos al +33 7 45 26 28 23.', pastDate:'Elige la fecha de hoy o una fecha posterior.', closed:'El restaurante está cerrado ese día. Elige otra fecha.', privacy:'Usamos tus datos de contacto solo para gestionar tu reserva.', policy:'Privacidad', chooseDate:'Elegir fecha', chooseTime:'Elegir hora', weekdays:['Lu','Ma','Mi','Ju','Vi','Sá','Do'] },
};

const locale = { fr:'fr-FR', en:'en-GB', es:'es-ES' } as const;

function todayInFoix() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function isoDate(year:number, month:number, day:number) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
function parseIso(value:string) {
  const [year,month,day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
function calendarCells(year:number, month:number) {
  const first = new Date(year,month,1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(year,month + 1,0).getDate();
  return [...Array(offset).fill(null), ...Array.from({length:days},(_,i)=>i+1)];
}

export default function ReservationForm({lang}: {lang:Lang}) {
  const t = copy[lang];
  const minimumDate = todayInFoix();
  const initial = parseIso(minimumDate);
  const [busy,setBusy] = useState(false);
  const [status,setStatus] = useState<'idle'|'sent'|'sentNoEmail'|'error'|'pastDate'|'closed'>('idle');
  const [closedDates,setClosedDates] = useState<string[]>([]);
  const [date,setDate] = useState('');
  const [time,setTime] = useState('');
  const [dateOpen,setDateOpen] = useState(false);
  const [timeOpen,setTimeOpen] = useState(false);
  const [view,setView] = useState({year:initial.getFullYear(),month:initial.getMonth()});
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/reservations', { cache:'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then(body => setClosedDates(Array.isArray(body?.closedDates) ? body.closedDates.filter((item:unknown) => typeof item === 'string') : []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const close = (event:PointerEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setDateOpen(false); setTimeOpen(false);
      }
    };
    document.addEventListener('pointerdown',close);
    return () => document.removeEventListener('pointerdown',close);
  }, []);

  const chooseDate = (value:string) => {
    if (value < minimumDate) { setStatus('pastDate'); return; }
    if (closedDates.includes(value)) { setStatus('closed'); return; }
    setDate(value); setStatus('idle'); setDateOpen(false);
  };
  const changeMonth = (delta:number) => {
    const next = new Date(view.year,view.month + delta,1);
    const floor = new Date(initial.getFullYear(),initial.getMonth(),1);
    if (next < floor) return;
    setView({year:next.getFullYear(),month:next.getMonth()});
  };
  const dateLabel = date ? new Intl.DateTimeFormat(locale[lang],{day:'2-digit',month:'long',year:'numeric'}).format(parseIso(date)) : t.chooseDate;
  const monthLabel = new Intl.DateTimeFormat(locale[lang],{month:'long',year:'numeric'}).format(new Date(view.year,view.month,1));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const selectedDate = String(fields.get('date') || '');
    if (!selectedDate || selectedDate < minimumDate) { setStatus('pastDate'); return; }
    if (closedDates.includes(selectedDate)) { setStatus('closed'); return; }
    setBusy(true); setStatus('idle');
    try {
      const response = await fetch('/api/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        name:fields.get('name'), phone:fields.get('phone'), email:fields.get('email'), date:selectedDate, time:fields.get('time'),
        guests:Number(fields.get('guests')), website:fields.get('website'),
      })});
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (body?.code === 'RESTAURANT_CLOSED') { setStatus('closed'); return; }
        throw new Error('Send failed');
      }
      setStatus(body?.confirmationEmailSent === false ? 'sentNoEmail' : 'sent'); form.reset(); setDate(''); setTime('');
    } catch { setStatus('error'); }
    finally { setBusy(false); }
  }

  return <section id="reservation" className="reservation section printSection" aria-labelledby="reservation-title">
    <div><p className="eyebrow">05 / NOMADE</p><h2 id="reservation-title">{t.title}</h2><p className="lead">{t.intro}</p><p className="muted">{t.privacy} <Link href={`/${lang}/confidentialite`}>{t.policy}</Link></p></div>
    <form onSubmit={submit} className="reservationForm">
      <div className="reservationFields" ref={pickerRef}>
        <label>{t.name}<input name="name" type="text" autoComplete="name" minLength={2} maxLength={100} required /></label>
        <label>{t.phone}<input name="phone" type="tel" autoComplete="tel" minLength={6} maxLength={25} required /></label>
        <label className="emailField">{t.email}<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
        <label className="pickerField">{t.date}
          <input name="date" type="hidden" value={date} required readOnly />
          <button type="button" className={`pickerTrigger ${date?'hasValue':''}`} aria-haspopup="dialog" aria-expanded={dateOpen} onClick={()=>{setDateOpen(v=>!v);setTimeOpen(false)}}>{dateLabel}<span aria-hidden="true">⌄</span></button>
          {dateOpen && <div className="datePicker pickerPopover" role="dialog" aria-label={t.chooseDate}>
            <div className="pickerHead"><button type="button" aria-label="Previous month" onClick={()=>changeMonth(-1)} disabled={view.year===initial.getFullYear()&&view.month===initial.getMonth()}>‹</button><strong>{monthLabel}</strong><button type="button" aria-label="Next month" onClick={()=>changeMonth(1)}>›</button></div>
            <div className="weekdays">{t.weekdays.map(day=><span key={day}>{day}</span>)}</div>
            <div className="calendarGrid">{calendarCells(view.year,view.month).map((day,index)=>{
              if (!day) return <span key={`blank-${index}`} />;
              const value=isoDate(view.year,view.month,day);
              const disabled=value<minimumDate||closedDates.includes(value);
              return <button key={value} type="button" disabled={disabled} className={value===date?'selected':''} onClick={()=>chooseDate(value)}>{day}</button>;
            })}</div>
          </div>}
        </label>
        <label className="pickerField">{t.time}
          <input name="time" type="hidden" value={time} required readOnly />
          <button type="button" className={`pickerTrigger ${time?'hasValue':''}`} aria-haspopup="listbox" aria-expanded={timeOpen} onClick={()=>{setTimeOpen(v=>!v);setDateOpen(false)}}>{time || t.chooseTime}<span aria-hidden="true">⌄</span></button>
          {timeOpen && <div className="timePicker pickerPopover" role="listbox" aria-label={t.chooseTime}>{reservationTimeSlots.map(slot=><button key={slot} type="button" role="option" aria-selected={slot===time} className={slot===time?'selected':''} onClick={()=>{setTime(slot);setTimeOpen(false)}}>{slot}</button>)}</div>}
        </label>
        <label>{t.guests}<input name="guests" type="number" min="1" max="50" defaultValue="2" required /></label>
      </div>
      <div className="reservationTrap" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <button className="button" disabled={busy || !date || !time} type="submit">{busy?t.sending:t.send}</button>
      {status==='sent' && <p className="reservationStatus" role="status">{t.success}</p>}
      {status==='sentNoEmail' && <p className="reservationStatus" role="alert">{t.emailWarning}</p>}
      {status==='pastDate' && <p className="reservationStatus" role="alert">{t.pastDate}</p>}
      {status==='closed' && <p className="reservationStatus" role="alert">{t.closed}</p>}
      {status==='error' && <p className="reservationStatus" role="alert">{t.error} <a href="tel:+33745262823">07 45 26 28 23</a></p>}
    </form>
  </section>;
}
