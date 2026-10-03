import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CookieBanner from '../../components/CookieBanner';
import SiteFooter from '../../components/SiteFooter';
import { isSiteLanguage, pageMetadata } from '../../lib/seo';

export const dynamicParams = false;
const languages = ['fr', 'en', 'es'] as const;
type Lang = typeof languages[number];

function isLang(value: string): value is Lang { return isSiteLanguage(value); }

const meta = {
  fr: { title: 'NOMADE — Restaurant bistronomique & bar à Foix', description: 'Restaurant bistronomique et bar au cœur de Foix : cuisine au feu, produits locaux ariégeois, cocktails et demandes de réservation en ligne.' },
  en: { title: 'NOMADE — Bistronomic restaurant & bar in Foix', description: 'Bistronomic restaurant and bar in central Foix, serving fire-led cuisine, local Ariège produce, cocktails and online booking requests.' },
  es: { title: 'NOMADE — Restaurante bistronómico y bar en Foix', description: 'Restaurante bistronómico y bar en el centro de Foix: cocina al fuego, productos locales de Ariège, cócteles y solicitudes de reserva.' }
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: rawLang } = await params;
  if (!isLang(rawLang)) notFound();
  const m = meta[rawLang];
  return pageMetadata(rawLang, '', m.title, m.description);
}

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  if (!isLang(rawLang)) notFound();
  return <>{children}<SiteFooter lang={rawLang} /><CookieBanner lang={rawLang} /></>;
}
