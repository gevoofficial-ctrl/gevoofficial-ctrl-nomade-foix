'use client';

import { useEffect, useRef, useState } from 'react';

type HeroVideoProps = {
  fallback: string;
};

const playbackRate = 0.65;

export default function HeroVideo({ fallback }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const loopTransitionRef = useRef(false);
  const [loadMobileVideo, setLoadMobileVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoopTransitioning, setIsLoopTransitioning] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.defaultPlaybackRate = playbackRate;
    video.playbackRate = playbackRate;
  }, []);

  useEffect(() => {
    const isMobileViewport = window.matchMedia('(max-width: 800px)').matches;

    if (!isMobileViewport) return;

    const mobileModeTimeout = window.setTimeout(() => setIsMobile(true), 0);
    const videoTimeout = window.setTimeout(() => setLoadMobileVideo(true), 2500);
    return () => {
      window.clearTimeout(mobileModeTimeout);
      window.clearTimeout(videoTimeout);
    };
  }, []);

  useEffect(() => {
    if (!loadMobileVideo) return;

    const video = videoRef.current;
    if (!video) return;

    video.load();
    void video.play().catch(() => undefined);
  }, [loadMobileVideo]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (isMobile || !video || !Number.isFinite(video.duration) || loopTransitionRef.current) return;

    if (video.duration - video.currentTime <= 0.55) {
      loopTransitionRef.current = true;
      setIsLoopTransitioning(true);
    }
  };

  const handleEnded = () => {
    if (isMobile) return;

    const video = videoRef.current;
    if (!video) return;

    const revealRestart = () => {
      window.setTimeout(() => {
        setIsLoopTransitioning(false);
        loopTransitionRef.current = false;
      }, 80);
    };

    video.addEventListener('playing', revealRestart, { once: true });
    video.currentTime = 0;
    void video.play().catch(() => {
      video.removeEventListener('playing', revealRestart);
      setIsLoopTransitioning(false);
      loopTransitionRef.current = false;
    });
  };

  return (
    <video
      ref={videoRef}
      className={`heroVideo${isReady ? ' heroVideoReady' : ''}${isLoopTransitioning ? ' heroVideoLoopFade' : ''}`}
      autoPlay
      muted
      loop={isMobile}
      playsInline
      preload="metadata"
      poster="/video/nomade-hero-poster.jpg"
      onCanPlay={() => setIsReady(true)}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
    >
      <source media="(min-width: 801px)" src="/video/nomade-hero.mp4" type="video/mp4" />
      {loadMobileVideo && <source media="(max-width: 800px)" src="/video/nomade-hero.mp4" type="video/mp4" />}
      {fallback}
    </video>
  );
}
