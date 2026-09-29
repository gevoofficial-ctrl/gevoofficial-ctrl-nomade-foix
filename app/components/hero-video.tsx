'use client';

import { useEffect, useRef } from 'react';

type HeroVideoProps = {
  fallback: string;
};

const playbackRate = 0.65;

export default function HeroVideo({ fallback }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.defaultPlaybackRate = playbackRate;
    video.playbackRate = playbackRate;
  }, []);

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
      <source src="/video/nomade-hero.mp4" type="video/mp4" />
      {fallback}
    </video>
  );
}
