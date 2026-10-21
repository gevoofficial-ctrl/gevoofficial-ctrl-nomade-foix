export const MEASUREMENT_ID='G-LC87BGEPTJ';
export type AnalyticsRuntime={
  dataLayer?:unknown[];
  gtag?:(...args:unknown[])=>void;
  [key:string]:unknown;
};
const denied={analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'};

export function applyAnalyticsConsent(runtime:AnalyticsRuntime,allowed:boolean) {
  // Google's opt-out flag must be set before any calls, including revocation.
  runtime[`ga-disable-${MEASUREMENT_ID}`]=!allowed;
  runtime.dataLayer ||= [];
  runtime.gtag ||= function(){runtime.dataLayer!.push(arguments);};
  if(!runtime.__nomadeConsentInitialized){
    runtime.gtag('consent','default',denied);
    runtime.__nomadeConsentInitialized=true;
  }
  runtime.gtag('consent','update',{...denied,analytics_storage:allowed?'granted':'denied'});
}
export function clearAnalyticsCookies(doc:Pick<Document,'cookie'>,hostname:string) {
  try {
  const names=doc.cookie.split(';').map(part=>part.split('=')[0].trim()).filter(name=>/^_ga(?:_|$)/.test(name));
  const labels=hostname.split('.');
  const domains=['',...labels.slice(0,-1).map((_,index)=>labels.slice(index).join('.'))];
  for(const name of names)for(const domain of domains){
    doc.cookie=`${name}=; Max-Age=0; path=/;${domain?` domain=${domain};`:''} SameSite=Lax`;
  }
  }catch{/* Privacy-restricted browsers must remain usable. */}
}
