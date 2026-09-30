import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './menu.css';
import './reservation.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nomade-foix.fr'),
  title: 'NOMADE — Restaurant · Bar · Foix',
  description: 'Cuisine au feu, produits locaux, influences du monde.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const requestedLang = requestHeaders.get('x-nomade-lang');
  const lang = requestedLang === 'en' || requestedLang === 'es' ? requestedLang : 'fr';
  return (
    <html lang={lang}>
      <head>
        {/* The API route is deliberate: it keeps the stylesheet URL stable for staging caches. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/api/nomade-css?v=12" />
      </head>
      <body>{children}</body>
    </html>
  );
}
