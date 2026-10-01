import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import CookieSettingsButton from './CookieSettingsButton';

const copy = {
  fr: { legal: 'Mentions légales', privacy: 'Confidentialité', allergens: 'Allergènes', discover: 'Découvrir', cookies: 'Gérer les cookies' },
  en: { legal: 'Legal notice', privacy: 'Privacy', allergens: 'Allergens', discover: 'Discover', cookies: 'Manage cookies' },
  es: { legal: 'Aviso legal', privacy: 'Privacidad', allergens: 'Alérgenos', discover: 'Descubrir', cookies: 'Gestionar cookies' },
};

export default function SiteFooter({ lang }: { lang: 'fr' | 'en' | 'es' }) {
  const t = copy[lang];
  return <footer>
    <div className="logo"><Image src="/nomade-logo-light.svg" alt="NOMADE" width={2933} height={1000} /></div>
    <div>Restaurant · Bar · Foix</div>
    <Link href={`/${lang}/mentions-legales`}>{t.legal}</Link>
    <Link href={`/${lang}/confidentialite`}>{t.privacy}</Link>
    <Link href={`/${lang}/allergenes`}>{t.allergens}</Link>
    <CookieSettingsButton>{t.cookies}</CookieSettingsButton>
    <Link href={`/${lang}#top`}>{t.discover} <ArrowUpRight size={14} /></Link>
    <a href="https://www.instagram.com/nomadefoix?stkn=a3Y4eGp6MmM4Zjdq" target="_blank" rel="noopener noreferrer" aria-label="Instagram — @nomadefoix"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>
  </footer>;
}
