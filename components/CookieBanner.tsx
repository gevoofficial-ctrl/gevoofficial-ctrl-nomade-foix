'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'nomade-cookie-consent';
const MAX_AGE_MS = 13 * 30 * 24 * 60 * 60 * 1000;

const copy = {
  fr: { text: 'Nous utilisons des cookies pour mesurer l’audience du site. Vous pouvez accepter ou refuser leur dépôt.', accept: 'Tout accepter', reject: 'Tout refuser', more: 'En savoir plus' },
  en: { text: 'We use cookies to measure site traffic. You can accept or refuse them.', accept: 'Accept all', reject: 'Reject all', more: 'Learn more' },
  es: { text: 'Utilizamos cookies para medir la audiencia del sitio. Puede aceptarlas o rechazarlas.', accept: 'Aceptar todo', reject: 'Rechazar todo', more: 'Más información' }
};

export default function CookieBanner({ lang }: { lang: 'fr' | 'en' | 'es' }) {
  const [visible, setVisible] = useState(false);
  const t = copy[lang] ?? copy.fr;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const { timestamp } = raw ? JSON.parse(raw) : {};
        setVisible(!timestamp || Date.now() - timestamp > MAX_AGE_MS);
      } catch {
        setVisible(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);
  const choose = (value: 'accepted' | 'refused') => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, timestamp: Date.now() })); } catch {}
    setVisible(false);
  };
  if (!visible) return null;
  return (
    <div className="cookieBanner" role="region" aria-label="Cookies">
      <p>{t.text}{' '}<Link className="cookieLink" href={`/${lang}/confidentialite`}>{t.more}</Link></p>
      <div className="cookieActions">
        <button className="button ghost" onClick={() => choose('refused')}>{t.reject}</button>
        <button className="button" onClick={() => choose('accepted')}>{t.accept}</button>
      </div>
    </div>
  );
}
