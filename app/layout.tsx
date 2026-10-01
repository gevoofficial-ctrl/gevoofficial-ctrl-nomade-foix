import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { siteUrl } from '../lib/seo';
import GoogleAnalytics from '../components/GoogleAnalytics';
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:wght@400;500;600&display=swap" />
        <link rel="preload" as="image" href="/video/nomade-hero-poster.jpg" media="(max-width: 800px)" fetchPriority="high" />
        {/* The API route is deliberate: it keeps the stylesheet URL stable for staging caches. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/api/nomade-css?v=15" />
        <meta name="msvalidate.01" content="6765DEE9694A7BEA83306F67874B81D8" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantStructuredData) }} />
      </head>
      <body><GoogleAnalytics />{children}</body>
    </html>
  );
}
