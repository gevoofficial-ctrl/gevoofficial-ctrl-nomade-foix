import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nomade-foix.fr'),
  title: 'NOMADE — Restaurant · Bar · Foix',
  description: 'Cuisine au feu, produits locaux, influences du monde.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* The API route is deliberate: it keeps the stylesheet URL stable for staging caches. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/api/nomade-css?v=8" />
      </head>
      <body>{children}</body>
    </html>
  );
}
