'use client';

import { useEffect, useRef, useState } from 'react';

type HeroVideoProps = {
  fallback: string;
  lang: 'fr'|'en'|'es';
};

const playbackRate = 0.65;

export default function HeroVideo({ fallback, lang }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loadMobileVideo, setLoadMobileVideo] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [motionAllowed,setMotionAllowed]=useState(false);
  const [isPaused,setIsPaused]=useState(true);
  const userPaused=useRef(false);
  const labels={fr:{pause:'Mettre la vidéo en pause',play:'Lire la vidéo'},en:{pause:'Pause video',play:'Play video'},es:{pause:'Pausar vídeo',play:'Reproducir vídeo'}}[lang];

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.defaultPlaybackRate = playbackRate;
    video.playbackRate = playbackRate;
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>{
      setMotionAllowed(!preference.matches);
      if(preference.matches)video.pause();
    };
    update();
    preference.addEventListener('change',update);
    return()=>preference.removeEventListener('change',update);
  }, []);

  useEffect(() => {
    if (!window.matchMedia('(max-width: 800px)').matches) return;

    let active = true;
    let timeout: number | undefined;
    const schedule = () => {
      void document.fonts.ready.then(() => {
        if (active) timeout = window.setTimeout(() => setLoadMobileVideo(true), 2500);
      });
    };
    // The poster is immediately visible. Do not compete with first-screen
    // fonts/images by downloading the full movie before they finish.
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once:true });
    return () => { active = false; window.clearTimeout(timeout); window.removeEventListener('load', schedule); };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.load();
    if(motionAllowed&&!userPaused.current)void video.play().catch(() => undefined);
  }, [loadMobileVideo,motionAllowed]);

  return (
    <><video
      ref={videoRef}
      className={`heroVideo${isReady ? ' heroVideoReady' : ''}`}
      autoPlay={motionAllowed}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      poster="/video/nomade-hero-poster-v2.webp"
      onCanPlay={() => setIsReady(true)}
      onPause={()=>setIsPaused(true)}
      onPlay={()=>setIsPaused(false)}
    >
      {motionAllowed&&<source media="(min-width: 801px)" src="/video/nomade-hero.mp4" type="video/mp4" />}
      {motionAllowed&&loadMobileVideo && <source media="(max-width: 800px)" src="/video/nomade-hero-mobile-v1.mp4" type="video/mp4" />}
      {fallback}
    </video>{motionAllowed&&isReady&&<button type="button" className="heroVideoControl" aria-label={isPaused?labels.play:labels.pause} onClick={()=>{
      const video=videoRef.current;
      if(!video)return;
      if(video.paused){userPaused.current=false;void video.play().catch(()=>undefined);}
      else{userPaused.current=true;video.pause();}
    }}><span aria-hidden="true">{isPaused?'▶':'Ⅱ'}</span></button>}</>
  );
}
