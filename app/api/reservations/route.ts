import { NextRequest, NextResponse } from 'next/server';
import { mailConfiguration, mailTransport } from '../../../lib/mail';
import { sameOrigin } from '../../../lib/admin-auth';
import { isReservationTime } from '../../../lib/reservation-times';
import { reservationClosedDates, lunchReservationClosedDates } from '../../../lib/reservation-availability';
import { isSiteLanguage } from '../../../lib/seo';
import { reservationCopy, reservationConfirmation } from '../../../lib/reservation-localization';

export const runtime = 'nodejs';
const attempts = new Map<string, number[]>();
const sheetsWebhook = 'https://script.google.com/macros/s/AKfycbyIyOWq3t4XFYFjZJGpEYJpYvfOmriYIP8-PIAORzf2KBtWChSr1RT1rMqi4TQSJRuY/exec';

function todayInFoix() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone:'Europe/Paris', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
}

export async function GET() {
  try { return NextResponse.json({ closedDates:await lunchReservationClosedDates() }, { headers:{'Cache-Control':'no-store'} }); }
  catch { return NextResponse.json({ error:'Availability is temporarily unavailable' }, { status:503 }); }
}

export async function POST(request: NextRequest) {
  const requested=request.nextUrl.searchParams.get('lang')||'fr';
  let lang=isSiteLanguage(requested)?requested:'fr';
  let t=reservationCopy(lang);
  if (!sameOrigin(request)) return NextResponse.json({ error:t.origin }, { status:403 });
  if (Number(request.headers.get('content-length') || 0) > 4096) return NextResponse.json({ error:t.large }, { status:413 });
  const raw = await request.text().catch(() => '');
  if (raw.length > 4096) return NextResponse.json({ error:t.large }, { status:413 });
  const body = (() => { try { return JSON.parse(raw); } catch { return null; } })();
  if (!body || typeof body !== 'object') return NextResponse.json({ error:t.invalid }, { status:400 });
  if(isSiteLanguage(body.lang)){lang=body.lang;t=reservationCopy(lang);}
  // A hidden field catches basic automated form submissions without affecting guests.
  if (body.website) return NextResponse.json({ ok:true });
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const date = body.date, time = body.time, guests = body.guests;
  const validDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0,10) === date && date >= todayInFoix();
  if (name.length < 2 || name.length > 100 || /[\r\n]/.test(name) ||
      !/^[+0-9 ().-]{6,25}$/.test(phone) || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\r\n]/.test(email) || !validDate ||
      !isReservationTime(time) ||
      !Number.isInteger(guests) || guests < 1 || guests > 50) {
    return NextResponse.json({ error:t.details }, { status:400 });
  }
  try {
    if ((await reservationClosedDates()).includes(date)) {
      return NextResponse.json({ code:'RESTAURANT_CLOSED', error:t.closed }, { status:409 });
    }
  } catch {
    return NextResponse.json({ error:t.availability }, { status:503 });
  }
  const config = mailConfiguration();
  if (!config) return NextResponse.json({ error:t.unavailable }, { status:503 });
  const { from, to } = config;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter(at => now-at < 15*60_000);
  if (recent.length >= 3) return NextResponse.json({ error:t.rate }, { status:429 });
  attempts.set(ip, [...recent, now]);
  if (attempts.size > 2000) for (const [key, times] of attempts) if (times.every(at => now-at >= 15*60_000)) attempts.delete(key);
  try {
    const transport = mailTransport(config);
    await transport.sendMail({
      from, to,
      subject:`Nouvelle réservation confirmée NOMADE — ${date} ${time}`,
      text:`Nouvelle réservation confirmée automatiquement\n\nNom : ${name}\nTéléphone : ${phone}\nE-mail : ${email}\nDate : ${date}\nHeure : ${time} (Foix)\nPersonnes : ${guests}`,
    });

    let confirmationEmailSent = true;
    try {
      await transport.sendMail({
        from,
        to:email,
        ...reservationConfirmation(lang,name),
      });
    } catch (error) {
      confirmationEmailSent = false;
      console.error('Reservation confirmation email failed:', error);
    }

    // Mirror each valid reservation request to the NOMADE reservations sheet.
    // Email remains authoritative: a temporary Sheets failure must not lose the request.
    try {
      const sheetsResponse = await fetch(sheetsWebhook, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ name, phone, email, date, time, guests }),
        signal:AbortSignal.timeout(8000),
      });
      if (!sheetsResponse.ok) console.error('Reservation Sheets webhook failed:', sheetsResponse.status);
    } catch (error) {
      console.error('Reservation Sheets webhook error:', error);
    }

    return NextResponse.json({ ok:true, confirmationEmailSent });
  } catch {
    return NextResponse.json({ error:t.failed }, { status:502 });
  }
}
