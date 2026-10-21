'use client';

import { useEffect, useState } from 'react';

type Lang='fr'|'en'|'es';
const emptyDates:string[]=[];
const copy={
  fr:{loading:'Vérification des jours d’ouverture…',error:'Impossible de vérifier les dates pour le moment.',retry:'Réessayer'},
  en:{loading:'Checking available dates…',error:'We cannot check available dates right now.',retry:'Try again'},
  es:{loading:'Comprobando las fechas disponibles…',error:'No podemos comprobar las fechas en este momento.',retry:'Reintentar'},
};

export function useReservationAvailability(lang:Lang,onReady?:(dates:string[])=>void) {
  const [request,setRequest]=useState(0);
  const key=`${lang}:${request}`;
  const [result,setResult]=useState<{key:string;dates:string[];error:boolean}|null>(null);
  useEffect(()=>{
    let active=true;
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),15000);
    fetch('/api/reservations',{cache:'no-store',signal:controller.signal})
      .then(async response=>{if(!response.ok)throw new Error();return response.json();})
      .then(body=>{
        if(!Array.isArray(body.closedDates) || body.closedDates.some((date:unknown)=>typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)))throw new Error();
        if(active){setResult({key,dates:body.closedDates,error:false});onReady?.(body.closedDates);}
      })
      .catch(()=>{if(active)setResult({key,dates:emptyDates,error:true});})
      .finally(()=>clearTimeout(timeout));
    return()=>{active=false;clearTimeout(timeout);controller.abort();};
  },[key,onReady]);
  const current=result?.key===key;
  return {closedDates:current?result.dates:emptyDates,ready:current&&!result.error,error:current&&result.error,retry:()=>setRequest(value=>value+1)};
}

export function AvailabilityStatus({lang,availability}:{lang:Lang;availability:ReturnType<typeof useReservationAvailability>}) {
  if(availability.ready)return null;
  const t=copy[lang];
  return <div className="availabilityStatus" role="status">
    <span>{availability.error?t.error:t.loading}</span>
    {availability.error&&<><button type="button" onClick={availability.retry}>{t.retry}</button><a href="tel:+33745262823">+33 7 45 26 28 23</a></>}
  </div>;
}
