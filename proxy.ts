import { NextResponse, type NextRequest } from 'next/server';

const supportedLanguages = new Set(['fr', 'en', 'es']);
const canonicalHost = 'www.nomade-foix.fr';
const apexHost = 'nomade-foix.fr';

export function proxy(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim().toLowerCase();
  const host = (forwardedHost ?? request.headers.get('host')?.split(':')[0]?.trim().toLowerCase());
  const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
  const isKnownPublicHost = host === canonicalHost || host === apexHost;
  const isHttps = forwardedProtocol ? forwardedProtocol === 'https' : request.nextUrl.protocol === 'https:';

  // cPanel/Passenger forwards the original protocol and host to Next.js. This is a
  // defense in depth redirect; the web server should enforce the same rule first.
  if (isKnownPublicHost && (!isHttps || host !== canonicalHost)) {
    const destination = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      `https://${canonicalHost}`,
    );
    return NextResponse.redirect(destination, 308);
  }

  const lang = request.nextUrl.pathname.split('/')[1];
  if (!supportedLanguages.has(lang)) return NextResponse.next();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nomade-lang', lang);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
