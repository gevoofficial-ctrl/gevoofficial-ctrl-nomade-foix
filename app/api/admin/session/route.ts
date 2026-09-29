import { NextRequest, NextResponse } from 'next/server';
import { authorized, configured, cookieName, newSession, sameOrigin, validPassword } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';
export async function GET(request: NextRequest) { return NextResponse.json({ configured: configured(), authenticated: authorized(request) }, { headers: { 'Cache-Control': 'no-store' } }); }
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  if (!configured()) return NextResponse.json({ error: 'Set NOMADE_ADMIN_PASSWORD and NOMADE_ADMIN_SECRET on the server' }, { status: 503 });
  const body = await request.json().catch(() => null);
  if (!validPassword(body?.password ?? '')) return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(cookieName, newSession(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/admin', maxAge: 12*3600 });
  return response;
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(cookieName, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite:'strict', path:'/api/admin', maxAge:0 });
  return response;
}
