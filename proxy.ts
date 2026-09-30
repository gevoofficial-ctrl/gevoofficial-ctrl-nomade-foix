import { NextResponse, type NextRequest } from 'next/server';

const supportedLanguages = new Set(['fr', 'en', 'es']);

export function proxy(request: NextRequest) {
  const lang = request.nextUrl.pathname.split('/')[1];
  if (!supportedLanguages.has(lang)) return NextResponse.next();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nomade-lang', lang);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/fr/:path*', '/en/:path*', '/es/:path*'],
};
