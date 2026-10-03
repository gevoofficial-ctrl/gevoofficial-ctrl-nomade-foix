'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import './reservations.css';

const STATUSES = [
  'En attente de confirmation',
  'Confirmée',
  'Refusée',
  'À rappeler',
] as const;
type ReservationStatus = typeof STATUSES[number];

type Reservation = {
  key:string;
  id?:string | number;
  row?:number;
  rowNumber?:number;
  date:string;
  time:string;
  name:string;
  phone:string;
  guests:number;
  receivedAt:string;
  status:ReservationStatus;
  comment:string;
  editable:boolean;
};

const pad = (value:number) => String(value).padStart(2, '0');
const isoDate = (year:number, month:number, day:number) => `${year}-${pad(month + 1)}-${pad(day)}`;

function foixToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone:'Europe/Paris', year:'numeric', month:'2-digit', day:'2-digit',
  }).formatToParts(new Date());
  const part = (type:string) => parts.find(item => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function cleanDate(value:unknown) {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const french = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (french) return `${french[3]}-${pad(Number(french[2]))}-${pad(Number(french[1]))}`;
  return '';
}

function cleanTime(value:unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const text = String(value).trim();
  const simple = text.match(/^(\d{1,2}):(\d{2})/);
  if (simple) return `${pad(Number(simple[1]))}:${simple[2]}`;
  const iso = text.match(/T(\d{2}):(\d{2})/);
  return iso ? `${iso[1]}:${iso[2]}` : text;
}

function asRecord(value:unknown):Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function reservationArray(payload:unknown) {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  for (const key of ['reservations', 'data', 'items', 'rows']) {
    if (Array.isArray(record?.[key])) return record[key];
  }
  return [];
}

function normalize(payload:unknown):Reservation[] {
  return reservationArray(payload).map((value, index) => {
    const item = asRecord(value) ?? {};
    const id = typeof item.id === 'string' || typeof item.id === 'number'
      ? item.id
      : typeof item.reservationId === 'string' || typeof item.reservationId === 'number'
        ? item.reservationId
        : undefined;
    const row = Number.isInteger(Number(item.row)) && Number(item.row) > 0 ? Number(item.row) : undefined;
    const rowNumber = Number.isInteger(Number(item.rowNumber)) && Number(item.rowNumber) > 0 ? Number(item.rowNumber) : undefined;
    const rawStatus = typeof item.status === 'string' ? item.status.trim() : '';
    const status = STATUSES.includes(rawStatus as ReservationStatus)
      ? rawStatus as ReservationStatus
      : 'En attente de confirmation';
    const guests = Number(item.guests ?? item.people ?? item.covers ?? 0);
    const date = cleanDate(item.date ?? item.reservationDate);
    const time = cleanTime(item.time ?? item.reservationTime);
    return {
      key:String(id ?? row ?? rowNumber ?? `${date}-${time}-${index}`),
      id, row, rowNumber, date, time,
      name:String(item.name ?? item.customerName ?? item.fullName ?? '—'),
      phone:String(item.phone ?? item.telephone ?? item.tel ?? '—'),
      guests:Number.isFinite(guests) && guests > 0 ? guests : 0,
      receivedAt:String(item.receivedAt ?? item.createdAt ?? item.timestamp ?? ''),
      status,
      comment:typeof item.comment === 'string' ? item.comment : '',
      editable:id !== undefined || row !== undefined || rowNumber !== undefined,
    };
  }).filter(item => item.date);
}

async function requestJson(url:string, options?:RequestInit) {
  const response = await fetch(url, {
    ...options,
    cache:'no-store',
    headers:{ ...(options?.body ? {'Content-Type':'application/json'} : {}), ...options?.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'La requête a échoué');
  return body;
}

function monthLabel(year:number, month:number) {
  return new Intl.DateTimeFormat('fr-FR', { month:'long', year:'numeric', timeZone:'UTC' })
    .format(new Date(Date.UTC(year, month, 1)));
}

function receivedLabel(value:string) {
  if (!value) return 'Heure de réception non disponible';

  const french = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (french) {
    const [, dayText, monthText, yearText, hourText = '0', minuteText = '0', secondText = '0'] = french;
    const day = Number(dayText);
    const month = Number(monthText);
    const year = Number(yearText);
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const second = Number(secondText);
    const parsed = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    const valid = parsed.getUTCFullYear() === year
      && parsed.getUTCMonth() === month - 1
      && parsed.getUTCDate() === day
      && parsed.getUTCHours() === hour
      && parsed.getUTCMinutes() === minute
      && parsed.getUTCSeconds() === second;
    if (!valid) return value;
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone:'UTC', dateStyle:'medium', timeStyle:'short',
    }).format(parsed);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone:'Europe/Paris', dateStyle:'medium', timeStyle:'short',
  }).format(parsed);
}

function statusClass(status:ReservationStatus) {
  if (status === 'Confirmée') return 'confirmed';
  if (status === 'Refusée') return 'refused';
  if (status === 'À rappeler') return 'callback';
  return 'pending';
}

function ReservationCard({ reservation, busy, onSave }:{
  reservation:Reservation;
  busy:boolean;
  onSave:(reservation:Reservation, status:ReservationStatus, comment:string)=>Promise<void>;
}) {
  const [status, setStatus] = useState<ReservationStatus>(reservation.status);
  const [comment, setComment] = useState(reservation.comment);

  return <article className="reservationCard">
    <div className="reservationCardHead">
      <div><time>{reservation.time || '—'}</time><h3>{reservation.name}</h3></div>
      <span className={`statusBadge ${statusClass(reservation.status)}`}>{reservation.status}</span>
    </div>
    <dl className="reservationFacts">
      <div><dt>Téléphone</dt><dd><a href={`tel:${reservation.phone.replace(/[^+\d]/g, '')}`}>{reservation.phone}</a></dd></div>
      <div><dt>Personnes</dt><dd>{reservation.guests || '—'}</dd></div>
      <div><dt>Reçue</dt><dd>{receivedLabel(reservation.receivedAt)}</dd></div>
    </dl>
    <div className="reservationEdit">
      <label>Statut<select value={status} onChange={event => setStatus(event.target.value as ReservationStatus)} disabled={!reservation.editable || busy}>{STATUSES.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>Commentaire<textarea rows={3} maxLength={1000} value={comment} onChange={event => setComment(event.target.value)} disabled={!reservation.editable || busy} placeholder="Note interne du restaurant" /></label>
      <button type="button" disabled={!reservation.editable || busy || (status === reservation.status && comment.trim() === reservation.comment.trim())} onClick={() => onSave(reservation, status, comment)}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
      {!reservation.editable && <small>Identifiant de ligne absent : mise à jour indisponible.</small>}
    </div>
  </article>;
}

export default function ReservationsDashboard() {
  const today = useMemo(() => foixToday(), []);
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7)) - 1);
  const [selected, setSelected] = useState(today);
  const [auth, setAuth] = useState<'loading'|'locked'|'ready'|'unconfigured'>('loading');
  const [password, setPassword] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setReservations(normalize(await requestJson('/api/admin/reservations'))); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    requestJson('/api/admin/session').then(async session => {
      if (!session.configured) setAuth('unconfigured');
      else if (session.authenticated) { setAuth('ready'); await load(); }
      else setAuth('locked');
    }).catch(error => setMessage((error as Error).message));
  }, [load]);

  const byDate = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const reservation of reservations) map.set(reservation.date, [...(map.get(reservation.date) ?? []), reservation]);
    for (const items of map.values()) items.sort((a, b) => a.time.localeCompare(b.time));
    return map;
  }, [reservations]);
  const selectedReservations = byDate.get(selected) ?? [];
  const totalGuests = selectedReservations.reduce((sum, item) => sum + item.guests, 0);

  const days = useMemo(() => {
    const first = new Date(Date.UTC(year, month, 1));
    const mondayOffset = (first.getUTCDay() + 6) % 7;
    return Array.from({ length:42 }, (_, index) => {
      const value = new Date(Date.UTC(year, month, index - mondayOffset + 1));
      return { year:value.getUTCFullYear(), month:value.getUTCMonth(), day:value.getUTCDate() };
    });
  }, [year, month]);

  async function login(event:React.FormEvent) {
    event.preventDefault(); setLoading(true); setMessage('');
    try {
      await requestJson('/api/admin/session', { method:'POST', body:JSON.stringify({ password }) });
      setPassword(''); setAuth('ready'); await load();
    } catch (error) { setMessage((error as Error).message); }
    finally { setLoading(false); }
  }

  async function save(reservation:Reservation, status:ReservationStatus, comment:string) {
    setSaving(reservation.key); setMessage('');
    try {
      await requestJson('/api/admin/reservations', {
        method:'POST', body:JSON.stringify({ id:reservation.id, row:reservation.row, rowNumber:reservation.rowNumber, status, comment }),
      });
      await load(); setMessage('Réservation mise à jour dans Google Sheet.');
    } catch (error) { setMessage((error as Error).message); }
    finally { setSaving(''); }
  }

  function moveMonth(delta:number) {
    const next = new Date(Date.UTC(year, month + delta, 1));
    const nextYear = next.getUTCFullYear(), nextMonth = next.getUTCMonth();
    setYear(nextYear); setMonth(nextMonth);
    setSelected(today.startsWith(`${nextYear}-${pad(nextMonth + 1)}`) ? today : isoDate(nextYear, nextMonth, 1));
  }

  function goToday() {
    setYear(Number(today.slice(0, 4))); setMonth(Number(today.slice(5, 7)) - 1); setSelected(today);
  }

  async function logout() {
    await requestJson('/api/admin/session', { method:'DELETE' });
    setAuth('locked'); setReservations([]);
  }

  return <main className="reservationsPage">
    <header className="reservationsHeader">
      <div><span className="reservationsEyebrow">NOMADE · ADMINISTRATION</span><h1>Réservations</h1></div>
      {auth === 'ready' && <nav><Link href="/admin">La carte</Link><button type="button" onClick={logout}>Déconnexion</button></nav>}
    </header>
    {message && <p className="reservationsMessage" role="status">{message}</p>}
    {auth === 'loading' && <p>Chargement…</p>}
    {auth === 'unconfigured' && <p>Configurez NOMADE_ADMIN_PASSWORD et NOMADE_ADMIN_SECRET sur le serveur.</p>}
    {auth === 'locked' && <form className="reservationsLogin" onSubmit={login}><h2>Connexion</h2><label>Mot de passe<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label><button disabled={loading}>Se connecter</button></form>}
    {auth === 'ready' && <>
      <section className="calendarPanel" aria-label="Calendrier des réservations">
        <div className="calendarToolbar">
          <div><span className="reservationsEyebrow">CALENDRIER</span><h2>{monthLabel(year, month)}</h2></div>
          <div className="calendarActions"><button type="button" onClick={() => moveMonth(-1)} aria-label="Mois précédent">←</button><button type="button" onClick={goToday}>Aujourd’hui</button><button type="button" onClick={() => moveMonth(1)} aria-label="Mois suivant">→</button><button type="button" onClick={load} disabled={loading}>{loading ? '…' : 'Actualiser'}</button></div>
        </div>
        <div className="calendarWeekdays" aria-hidden="true">{['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(day => <span key={day}>{day}</span>)}</div>
        <div className="calendarGrid">{days.map(day => {
          const date = isoDate(day.year, day.month, day.day);
          const count = byDate.get(date)?.length ?? 0;
          return <button type="button" key={date} className={`${day.month !== month ? 'outside ' : ''}${date === selected ? 'selected ' : ''}${date === today ? 'today' : ''}`} onClick={() => { setSelected(date); setYear(day.year); setMonth(day.month); }} aria-label={`${date}, ${count} réservation${count === 1 ? '' : 's'}`}>
            <span className="calendarDayNumber">{day.day}</span>{count > 0 && <span className="calendarCount"><i />{count}</span>}
          </button>;
        })}</div>
      </section>
      <section className="dayPanel">
        <div className="daySummary"><div><span className="reservationsEyebrow">JOUR SÉLECTIONNÉ</span><h2>{new Intl.DateTimeFormat('fr-FR', { dateStyle:'full', timeZone:'UTC' }).format(new Date(`${selected}T00:00:00Z`))}</h2></div><div className="dayTotals"><strong>{selectedReservations.length}</strong><span>réservation{selectedReservations.length === 1 ? '' : 's'}</span><strong>{totalGuests}</strong><span>personne{totalGuests === 1 ? '' : 's'}</span></div></div>
        {selectedReservations.length === 0 ? <div className="emptyDay"><span>—</span><p>Aucune réservation pour cette date.</p></div> : <div className="reservationList">{selectedReservations.map(reservation => <ReservationCard key={`${reservation.key}-${reservation.status}-${reservation.comment}`} reservation={reservation} busy={saving === reservation.key} onSave={save} />)}</div>}
      </section>
    </>}
  </main>;
}
