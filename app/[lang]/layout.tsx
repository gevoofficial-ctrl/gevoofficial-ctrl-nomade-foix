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
  fr: { title: 'NOMADE — Restaurant · Bar · Foix', description: 'Cuisine au feu, produits locaux, influences du monde.' },
  en: { title: 'NOMADE — Restaurant · Bar · Foix', description: 'Fire cooking, local produce and global influences.' },
  es: { title: 'NOMADE — Restaurante · Bar · Foix', description: 'Cocina al fuego, productos locales e influencias del mundo.' }
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
