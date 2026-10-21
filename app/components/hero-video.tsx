'use client';

import { useEffect, useRef, useState } from 'react';

type HeroVideoProps = {
  fallback: string;
};

const playbackRate = 0.65;

export default function HeroVideo({ fallback }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loadMobileVideo, setLoadMobileVideo] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.defaultPlaybackRate = playbackRate;
    video.playbackRate = playbackRate;
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
    if (!loadMobileVideo) return;

    const video = videoRef.current;
    if (!video) return;

    video.load();
    void video.play().catch(() => undefined);
  }, [loadMobileVideo]);

  return (
    <video
      ref={videoRef}
      className={`heroVideo${isReady ? ' heroVideoReady' : ''}`}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster="/video/nomade-hero-poster-v2.webp"
      onCanPlay={() => setIsReady(true)}
    >
      <source media="(min-width: 801px)" src="/video/nomade-hero.mp4" type="video/mp4" />
      {loadMobileVideo && <source media="(max-width: 800px)" src="/video/nomade-hero.mp4" type="video/mp4" />}
      {fallback}
    </video>
  );
}
