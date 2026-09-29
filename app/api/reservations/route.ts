import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { sameOrigin } from '../../../lib/admin-auth';

export const runtime = 'nodejs';
const attempts = new Map<string, number[]>();

function todayInFoix() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone:'Europe/Paris', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error:'Invalid origin' }, { status:403 });
  if (Number(request.headers.get('content-length') || 0) > 4096) return NextResponse.json({ error:'Request too large' }, { status:413 });
  const raw = await request.text().catch(() => '');
  if (raw.length > 4096) return NextResponse.json({ error:'Request too large' }, { status:413 });
  const body = (() => { try { return JSON.parse(raw); } catch { return null; } })();
  if (!body || typeof body !== 'object') return NextResponse.json({ error:'Invalid request' }, { status:400 });
  // A hidden field catches basic automated form submissions without affecting guests.
  if (body.website) return NextResponse.json({ ok:true });
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const date = body.date, time = body.time, guests = body.guests;
  const validDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0,10) === date && date >= todayInFoix();
  if (name.length < 2 || name.length > 100 || /[\r\n]/.test(name) ||
      !/^[+0-9 ().-]{6,25}$/.test(phone) || !validDate ||
      typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
      !Number.isInteger(guests) || guests < 1 || guests > 50) {
    return NextResponse.json({ error:'Please check the reservation details' }, { status:400 });
  }
  const host = process.env.NOMADE_SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.NOMADE_SMTP_PORT || 465);
  const secure = process.env.NOMADE_SMTP_SECURE === 'true' || port === 465;
  const user = process.env.NOMADE_SMTP_USER || 'nomaderestaubar@gmail.com';
  const pass = process.env.NOMADE_SMTP_PASSWORD;
  const from = process.env.NOMADE_SMTP_FROM || user;
  const to = process.env.NOMADE_RESERVATIONS_TO || 'nomaderestaubar@gmail.com';
  if (!host || !user || !pass || !from || !to || !Number.isInteger(port) || port < 1 || port > 65535) {
    return NextResponse.json({ error:'Reservations are temporarily unavailable. Please call the restaurant.' }, { status:503 });
  }
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter(at => now-at < 15*60_000);
  if (recent.length >= 3) return NextResponse.json({ error:'Too many requests. Please call the restaurant.' }, { status:429 });
  attempts.set(ip, [...recent, now]);
  if (attempts.size > 2000) for (const [key, times] of attempts) if (times.every(at => now-at >= 15*60_000)) attempts.delete(key);
  try {
    const transport = nodemailer.createTransport({ host, port, secure, requireTLS:!secure,
      auth:{user,pass}, connectionTimeout:10000, greetingTimeout:10000, socketTimeout:15000 });
    await transport.sendMail({
      from, to,
      subject:`Demande de réservation NOMADE — ${date} ${time}`,
      text:`Nouvelle demande de réservation (à confirmer)\n\nNom : ${name}\nTéléphone : ${phone}\nDate : ${date}\nHeure : ${time} (Foix)\nPersonnes : ${guests}\n\nCette demande ne confirme pas la réservation. Veuillez contacter le client.`,
    });
    return NextResponse.json({ ok:true });
  } catch {
    return NextResponse.json({ error:'Unable to send the request. Please call the restaurant.' }, { status:502 });
  }
}
