'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { COOKIE_CONSENT_CHANGED_EVENT } from './CookieSettingsButton';

const STORAGE_KEY = 'nomade-cookie-consent';
const ANALYTICS_CONSENT_VERSION = 1;
const MEASUREMENT_ID = 'G-LC87BGEPTJ';

function hasAnalyticsConsent() {
  try {
    const { value, analyticsConsentVersion } = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return value === 'accepted' && analyticsConsentVersion === ANALYTICS_CONSENT_VERSION;
  } catch {
    return false;
  }
}

export default function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const syncConsent = () => setEnabled(hasAnalyticsConsent());
    syncConsent();
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncConsent);
  }, []);

  if (!enabled) return null;

  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`} strategy="afterInteractive" />
    <Script id="google-analytics" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${MEASUREMENT_ID}');
    `}</Script>
  </>;
}
