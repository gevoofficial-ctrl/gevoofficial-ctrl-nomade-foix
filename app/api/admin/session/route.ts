import { NextRequest, NextResponse } from 'next/server';
import { authorized, configured, cookieName, newSession, sameOrigin, validPassword } from '../../../../lib/admin-auth';
import { checkAdminLoginRateLimit } from '../../../../lib/admin-login-rate-limit';

export const runtime = 'nodejs';
export async function GET(request: NextRequest) { return NextResponse.json({ configured: configured(), authenticated: authorized(request) }, { headers: { 'Cache-Control': 'no-store' } }); }
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origine non valide' }, { status: 403 });
  if (!configured()) return NextResponse.json({ error: 'Configurez NOMADE_ADMIN_PASSWORD et NOMADE_ADMIN_SECRET sur le serveur' }, { status: 503 });
  if(Number(request.headers.get('content-length')||0)>4096)return NextResponse.json({error:'Requête trop volumineuse'},{status:413});
  const raw=await request.text().catch(()=>'');
  if(raw.length>4096)return NextResponse.json({error:'Requête trop volumineuse'},{status:413});
  try{
    const address=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
    const limit=await checkAdminLoginRateLimit(address);
    if(!limit.allowed)return NextResponse.json({error:'Trop de tentatives de connexion. Réessayez dans quelques minutes.'},{status:429,headers:{'Retry-After':String(limit.retryAfter),'Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'La connexion est momentanément indisponible. Réessayez plus tard.'},{status:503});}
  const body=(()=>{try{return JSON.parse(raw);}catch{return null;}})();
  if (!validPassword(body?.password ?? '')) return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(cookieName, newSession(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/admin', maxAge: 12*3600 });
  return response;
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origine non valide' }, { status: 403 });
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(cookieName, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite:'strict', path:'/api/admin', maxAge:0 });
  return response;
}
