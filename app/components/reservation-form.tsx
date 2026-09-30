'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { Lang } from '../../lib/menu';

const copy = {
  fr: { title:'Votre table chez NOMADE', intro:'Envoyez votre demande. Notre équipe vous contactera pour confirmer la disponibilité.', name:'Nom', phone:'Téléphone', date:'Date', time:'Heure', guests:'Nombre de personnes', send:'Envoyer la demande', sending:'Envoi…', success:'Votre demande a été envoyée. La réservation sera confirmée par notre équipe.', error:'Impossible d’envoyer la demande. Appelez-nous au 07 45 26 28 23.', pastDate:'Choisissez une date à partir d’aujourd’hui.', privacy:'Vos coordonnées servent uniquement à répondre à votre demande.', policy:'Confidentialité' },
  en: { title:'Your table at NOMADE', intro:'Send a request. Our team will contact you to confirm availability.', name:'Name', phone:'Phone number', date:'Date', time:'Time', guests:'Number of guests', send:'Send request', sending:'Sending…', success:'Your request has been sent. Our team will confirm the reservation.', error:'Unable to send your request. Call us on +33 7 45 26 28 23.', pastDate:'Choose today or a future date.', privacy:'We use your contact details only to respond to your request.', policy:'Privacy policy' },
  es: { title:'Tu mesa en NOMADE', intro:'Envía una solicitud. Nuestro equipo te contactará para confirmar la disponibilidad.', name:'Nombre', phone:'Teléfono', date:'Fecha', time:'Hora', guests:'Número de personas', send:'Enviar solicitud', sending:'Enviando…', success:'Tu solicitud se ha enviado. Nuestro equipo confirmará la reserva.', error:'No se pudo enviar la solicitud. Llámanos al +33 7 45 26 28 23.', pastDate:'Elige la fecha de hoy o una fecha posterior.', privacy:'Usamos tus datos de contacto solo para responder a tu solicitud.', policy:'Privacidad' },
};

function todayInFoix() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export default function ReservationForm({lang}: {lang:Lang}) {
  const t = copy[lang];
  const [busy,setBusy] = useState(false);
  const [status,setStatus] = useState<'idle'|'sent'|'error'|'pastDate'>('idle');
  const minimumDate = todayInFoix();
  const validateDate = (value: string) => setStatus(value && value < minimumDate ? 'pastDate' : 'idle');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    if (String(fields.get('date') || '') < minimumDate) {
      setStatus('pastDate');
      return;
    }
    setBusy(true); setStatus('idle');
    try {
      const response = await fetch('/api/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        name:fields.get('name'), phone:fields.get('phone'), date:fields.get('date'), time:fields.get('time'),
        guests:Number(fields.get('guests')), website:fields.get('website'),
      })});
      if (!response.ok) throw new Error('Send failed');
      setStatus('sent'); form.reset();
    } catch { setStatus('error'); }
    finally { setBusy(false); }
  }
  return <section id="reservation" className="reservation section printSection" aria-labelledby="reservation-title">
    <div><p className="eyebrow">05 / NOMADE</p><h2 id="reservation-title">{t.title}</h2><p className="lead">{t.intro}</p><p className="muted">{t.privacy} <Link href={`/${lang}/confidentialite`}>{t.policy}</Link></p></div>
    <form onSubmit={submit} className="reservationForm">
      <div className="reservationFields"><label>{t.name}<input name="name" type="text" autoComplete="name" minLength={2} maxLength={100} required /></label><label>{t.phone}<input name="phone" type="tel" autoComplete="tel" minLength={6} maxLength={25} required /></label><label>{t.date}<input name="date" type="date" min={minimumDate} onChange={event => validateDate(event.currentTarget.value)} onInvalid={event => validateDate(event.currentTarget.value)} required /></label><label>{t.time}<input name="time" type="time" required /></label><label>{t.guests}<input name="guests" type="number" min="1" max="50" defaultValue="2" required /></label></div>
      <div className="reservationTrap" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <button className="button" disabled={busy} type="submit">{busy?t.sending:t.send}</button>
      {status==='sent' && <p className="reservationStatus" role="status">{t.success}</p>}
      {status==='pastDate' && <p className="reservationStatus" role="alert">{t.pastDate}</p>}
      {status==='error' && <p className="reservationStatus" role="alert">{t.error} <a href="tel:+33745262823">07 45 26 28 23</a></p>}
    </form>
  </section>;
}
