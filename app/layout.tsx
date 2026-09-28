import type { Metadata } from 'next';
import './nomade.css';

export const metadata: Metadata = {
  title: 'NOMADE — Restaurant · Bar · Foix',
  description: 'Cuisine au feu, produits locaux, influences du monde.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>;
}
