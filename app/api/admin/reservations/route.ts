import { NextRequest, NextResponse } from 'next/server';
import { authorized, sameOrigin } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const webhook = 'https://script.google.com/macros/s/AKfycbyIyOWq3t4XFYFjZJGpEYJpYvfOmriYIP8-PIAORzf2KBtWChSr1RT1rMqi4TQSJRuY/exec';
const statuses = new Set([
  'En attente de confirmation',
  'Confirmée',
  'Refusée',
  'À rappeler',
]);

const json = (body: unknown, init?: ResponseInit) => NextResponse.json(body, {
  ...init,
  headers: { 'Cache-Control':'no-store', ...init?.headers },
});

function token() {
  return process.env.NOMADE_RESERVATIONS_TOKEN?.trim() ?? '';
}

async function readUpstream(response: Response) {
  const text = await response.text();
  try { return JSON.parse(text) as unknown; }
  catch { throw new Error('Invalid response from reservations service'); }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return json({ error:'Non autorisé' }, { status:401 });
  const serverToken = token();
  if (!serverToken) return json({ error:'NOMADE_RESERVATIONS_TOKEN is not configured' }, { status:503 });

  try {
    const url = new URL(webhook);
    url.searchParams.set('token', serverToken);
    url.searchParams.set('action', 'getReservations');
    const response = await fetch(url, { cache:'no-store', signal:AbortSignal.timeout(12000) });
    const body = await readUpstream(response);
    if (!response.ok) return json({ error:'Le service des réservations est indisponible' }, { status:502 });
    if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
      return json({ error:'Le service des réservations a refusé la requête' }, { status:502 });
    }
    if (body && typeof body === 'object' && ('ok' in body || 'success' in body)) {
      const acknowledged = ('ok' in body ? body.ok : body.success) !== false;
      if (!acknowledged) return json({ error:'Le service des réservations a refusé la requête' }, { status:502 });
    }
    return json(body);
  } catch {
    console.error('Reservations dashboard GET failed');
    return json({ error:'Impossible de charger les réservations' }, { status:502 });
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return json({ error:'Non autorisé' }, { status:401 });
  if (!sameOrigin(request)) return json({ error:'Origine non valide' }, { status:403 });
  if (Number(request.headers.get('content-length') || 0) > 8192) return json({ error:'Requête trop volumineuse' }, { status:413 });

  const serverToken = token();
  if (!serverToken) return json({ error:'NOMADE_RESERVATIONS_TOKEN is not configured' }, { status:503 });
  const raw = await request.text().catch(() => '');
  if (raw.length > 8192) return json({ error:'Requête trop volumineuse' }, { status:413 });
  const body = (() => { try { return JSON.parse(raw); } catch { return null; } })();
  if (body?.action === 'setClosure') {
    const date = typeof body.date === 'string' ? body.date : '';
    const closed = body.closed;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date || typeof closed !== 'boolean') {
      return json({ error:'Date de fermeture non valide' }, { status:400 });
    }
    try {
      const url = new URL(webhook);
      url.searchParams.set('token', serverToken);
      url.searchParams.set('action', 'setClosure');
      const response = await fetch(url, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ token:serverToken, action:'setClosure', date, closed }),
        cache:'no-store', signal:AbortSignal.timeout(12000),
      });
      const result = await readUpstream(response);
      if (!response.ok || !result || typeof result !== 'object' || ('ok' in result && result.ok === false)) {
        return json({ error:'La fermeture n’a pas été enregistrée' }, { status:502 });
      }
      return json(result);
    } catch {
      console.error('Reservations closure update failed');
      return json({ error:'Impossible de mettre à jour la fermeture' }, { status:502 });
    }
  }
  const status = typeof body?.status === 'string' ? body.status : '';
  const comment = typeof body?.comment === 'string' ? body.comment.trim() : '';
  const id = typeof body?.id === 'string' || typeof body?.id === 'number' ? body.id : undefined;
  const row = Number.isInteger(body?.row) && body.row > 0 ? body.row : undefined;
  const rowNumber = Number.isInteger(body?.rowNumber) && body.rowNumber > 0 ? body.rowNumber : undefined;

  if (!statuses.has(status) || comment.length > 1000 || (id === undefined && row === undefined && rowNumber === undefined)) {
    return json({ error:'Mise à jour non valide' }, { status:400 });
  }

  try {
    const url = new URL(webhook);
    url.searchParams.set('token', serverToken);
    url.searchParams.set('action', 'updateReservation');
    const response = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ token:serverToken, action:'updateReservation', id, reservationId:id, row, rowNumber, status, comment }),
      cache:'no-store',
      signal:AbortSignal.timeout(12000),
    });
    const result = await readUpstream(response);
    if (!response.ok) return json({ error:'La mise à jour a échoué' }, { status:502 });
    if (result && typeof result === 'object' && 'error' in result && typeof result.error === 'string') {
      return json({ error:'La mise à jour a été refusée' }, { status:502 });
    }
    if (result && typeof result === 'object' && ('ok' in result || 'success' in result)) {
      const acknowledged = ('ok' in result ? result.ok : result.success) !== false;
      if (!acknowledged) return json({ error:'La mise à jour a été refusée' }, { status:502 });
    }
    return json(result);
  } catch {
    console.error('Reservations dashboard POST failed');
    return json({ error:'Impossible de mettre à jour la réservation' }, { status:502 });
  }
}
