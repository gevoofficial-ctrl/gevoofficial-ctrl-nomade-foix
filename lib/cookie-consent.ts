export const COOKIE_STORAGE_KEY = 'nomade-cookie-consent';
export const ANALYTICS_CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_MS = 13 * 30 * 24 * 60 * 60 * 1000;
export type CookieConsent = { value:'accepted'|'refused'; timestamp:number; analyticsConsentVersion:number };

/** The banner and analytics loader must agree, including expiry. */
export function parseCookieConsent(raw:string|null, now=Date.now()):CookieConsent|null {
  try {
    const consent:unknown=JSON.parse(raw??'null');
    if(!consent||typeof consent!=='object')return null;
    const {value,timestamp,analyticsConsentVersion}=consent as Partial<CookieConsent>;
    if((value!=='accepted'&&value!=='refused')||analyticsConsentVersion!==ANALYTICS_CONSENT_VERSION||
      typeof timestamp!=='number'||!Number.isFinite(timestamp)||timestamp<=0||timestamp>now||now-timestamp>=CONSENT_MAX_AGE_MS)return null;
    return {value,timestamp,analyticsConsentVersion};
  }catch{return null;}
}
export function readCookieConsent(storage:Pick<Storage,'getItem'>,now=Date.now()) {
  try{return parseCookieConsent(storage.getItem(COOKIE_STORAGE_KEY),now);}catch{return null;}
}
export function browserCookieConsent(){
  try{return readCookieConsent(window.localStorage);}catch{return null;}
}
