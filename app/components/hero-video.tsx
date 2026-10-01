'use client';

import { useEffect, useRef, useState } from 'react';

type HeroVideoProps = {
  fallback: string;
};

const playbackRate = 0.65;

export default function HeroVideo({ fallback }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loadMobileVideo, setLoadMobileVideo] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.defaultPlaybackRate = playbackRate;
    video.playbackRate = playbackRate;
  }, []);

  useEffect(() => {
    if (!window.matchMedia('(max-width: 800px)').matches) return;

    const timeout = window.setTimeout(() => setLoadMobileVideo(true), 2500);
    return () => window.clearTimeout(timeout);
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
      className="heroVideo"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster="/video/nomade-hero-poster.jpg"
    >
      <source media="(min-width: 801px)" src="/video/nomade-hero.mp4" type="video/mp4" />
      {loadMobileVideo && <source media="(max-width: 800px)" src="/video/nomade-hero.mp4" type="video/mp4" />}
      {fallback}
    </video>
  );
}
