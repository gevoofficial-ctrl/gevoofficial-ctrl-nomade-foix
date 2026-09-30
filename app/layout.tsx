import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { siteUrl } from '../lib/seo';
import './menu.css';
import './reservation.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
};

const restaurantStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'NOMADE',
  url: `${siteUrl}/fr`,
  image: `${siteUrl}/video/nomade-hero-poster.jpg`,
  telephone: '+33745262823',
  email: 'nomaderestaubar@gmail.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '42 Rue des Chapeliers',
    postalCode: '09000',
    addressLocality: 'Foix',
    addressCountry: 'FR',
  },
  sameAs: ['https://www.instagram.com/nomaderestaubar/'],
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantStructuredData) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
