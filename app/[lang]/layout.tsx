import type { Metadata } from 'next';
import '../../app/globals.css';

const meta = {
  fr: { title: 'NOMADE — Restaurant · Bar · Foix', description: 'Cuisine au feu, produits locaux, influences du monde.' },
  en: { title: 'NOMADE — Restaurant · Bar · Foix', description: 'Fire cooking, local produce and global influences.' },
  es: { title: 'NOMADE — Restaurante · Bar · Foix', description: 'Cocina al fuego, productos locales e influencias del mundo.' }
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const m = meta[lang as keyof typeof meta] ?? meta.fr;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: 'https://www.nomade-foix.fr/' + lang,
      languages: { fr: '/fr', en: '/en', es: '/es' }
    },
    openGraph: { title: m.title, description: m.description, locale: lang }
  };
}

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <>{children}</>;
}
