'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'nomade-cookie-consent';
const MAX_AGE_MS = 13 * 30 * 24 * 60 * 60 * 1000;

const copy = {
  fr: { text: 'Aucun cookie publicitaire ou de mesure d’audience n’est actuellement activé. Nous mémorisons uniquement votre choix de consentement dans le stockage local de votre navigateur.', accept: 'Accepter', reject: 'Refuser', more: 'En savoir plus', manage: 'Gérer les cookies' },
  en: { text: 'No advertising or audience-measurement cookies are currently enabled. We only store your consent choice in your browser’s local storage.', accept: 'Accept', reject: 'Reject', more: 'Learn more', manage: 'Manage cookies' },
  es: { text: 'Actualmente no hay cookies publicitarias ni de medición de audiencia activadas. Solo guardamos tu elección de consentimiento en el almacenamiento local del navegador.', accept: 'Aceptar', reject: 'Rechazar', more: 'Más información', manage: 'Gestionar cookies' }
};

export default function CookieBanner({ lang }: { lang: 'fr' | 'en' | 'es' }) {
  const [visible, setVisible] = useState(false);
  const [choice, setChoice] = useState<'accepted' | 'refused' | null>(null);
  const t = copy[lang] ?? copy.fr;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const { value, timestamp } = raw ? JSON.parse(raw) : {};
        const current = value === 'accepted' || value === 'refused' ? value : null;
        setChoice(current);
        setVisible(!current || !timestamp || Date.now() - timestamp > MAX_AGE_MS);
      } catch {
        setVisible(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);
  const choose = (value: 'accepted' | 'refused') => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, timestamp: Date.now() })); } catch {}
    setChoice(value);
    setVisible(false);
  };
  if (!visible) return choice ? <button className="cookieSettings" type="button" onClick={() => setVisible(true)}>{t.manage}</button> : null;
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
