import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NOMADE — Restaurant · Bar · Foix',
  description: 'Cuisine au feu, produits locaux, influences du monde.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="stylesheet" href="/nomade.css?v=20260928-2" />
      </head>
      <body>{children}</body>
    </html>
  );
}
