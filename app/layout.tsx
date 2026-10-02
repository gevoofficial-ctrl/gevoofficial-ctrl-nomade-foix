import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { siteUrl } from '../lib/seo';
import GoogleAnalytics from '../components/GoogleAnalytics';
import './menu.css';
import './reservation.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  verification: {
    google: 'oWAKBaBz9YyePh8wAI3OsoB6aqU_Z60_Wi_eGYCO8-s',
  },
};

const restaurantStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  '@id': `${siteUrl}/#restaurant`,
  name: 'NOMADE',
  alternateName: 'Le Nomade',
  description: 'Restaurant bistronomique et bar à Foix : cuisine au feu, produits locaux ariégeois et influences du monde.',
  url: `${siteUrl}/fr`,
  mainEntityOfPage: `${siteUrl}/fr`,
  image: [
    `${siteUrl}/video/nomade-hero-poster.jpg`,
    `${siteUrl}/images/nomade-facade.webp`,
    `${siteUrl}/images/nomade-interieur.webp`,
  ],
  logo: `${siteUrl}/nomade-logo-light.svg`,
  telephone: '+33745262823',
  email: 'nomaderestaubar@gmail.com',
  hasMenu: `${siteUrl}/fr/carte`,
  servesCuisine: ['Cuisine bistronomique', 'Cuisine au feu de bois', 'Cuisine locavore', 'Cuisine aux influences internationales'],
  address: {
    '@type': 'PostalAddress',
    streetAddress: '42 Rue des Chapeliers',
    postalCode: '09000',
    addressLocality: 'Foix',
    addressRegion: 'Occitanie',
    addressCountry: 'FR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 42.96527,
    longitude: 1.60549,
  },
  areaServed: {
    '@type': 'City',
    name: 'Foix',
  },
  sameAs: ['https://www.instagram.com/nomadefoix/'],
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
