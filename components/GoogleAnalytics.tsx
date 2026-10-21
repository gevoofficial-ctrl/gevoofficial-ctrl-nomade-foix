'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { COOKIE_CONSENT_CHANGED_EVENT } from './CookieSettingsButton';
import { COOKIE_STORAGE_KEY, CONSENT_MAX_AGE_MS, browserCookieConsent } from '../lib/cookie-consent';
import { applyAnalyticsConsent, clearAnalyticsCookies, MEASUREMENT_ID, type AnalyticsRuntime } from '../lib/analytics-consent';

export default function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let timer:number|undefined;
    const syncConsent=()=>{
      const consent=browserCookieConsent();
      const allowed=consent?.value==='accepted';
      applyAnalyticsConsent(window as unknown as AnalyticsRuntime,allowed);
      if(!allowed)clearAnalyticsCookies(document,location.hostname);
      setEnabled(allowed);
      window.clearTimeout(timer);
      if(consent)timer=window.setTimeout(syncConsent,Math.min(2147483647,Math.max(1,consent.timestamp+CONSENT_MAX_AGE_MS-Date.now())));
    };
    const onStorage=(event:StorageEvent)=>{if(event.key===null||event.key===COOKIE_STORAGE_KEY)syncConsent();};
    syncConsent();
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncConsent);
    window.addEventListener('storage',onStorage);
    return () => {window.clearTimeout(timer);window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, syncConsent);window.removeEventListener('storage',onStorage);};
  }, []);

  if (!enabled) return null;

  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`} strategy="afterInteractive" onReady={()=>{
    const allowed=browserCookieConsent()?.value==='accepted';
    const runtime=window as unknown as AnalyticsRuntime;
    applyAnalyticsConsent(runtime,allowed);
    if(allowed&&!runtime.__nomadeAnalyticsConfigured){
      runtime.gtag!('js',new Date());
      runtime.gtag!('config',MEASUREMENT_ID,{allow_google_signals:false,allow_ad_personalization_signals:false});
      runtime.__nomadeAnalyticsConfigured=true;
    }
  }}/>;
}
