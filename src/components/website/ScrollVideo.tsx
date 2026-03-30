"use client";

import { useEffect, useRef } from "react";

interface ScrollVideoProps {
  src: string;
  className?: string;
  /** How much of the viewport scroll range drives the video (default: 1.0) */
  scrollRange?: number;
}

/**
 * A video that scrubs its playback position based on scroll.
 * As you scroll down, the video plays forward; scroll up, it rewinds.
 */
export function ScrollVideo({ src, className = "", scrollRange = 1.0 }: ScrollVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    // Ensure video metadata is loaded so we know duration
    const handleMetadata = () => {
      updateVideoTime();
    };

    const updateVideoTime = () => {
      if (!video.duration || !isFinite(video.duration)) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate progress: 0 when element enters viewport bottom, 1 when it leaves top
      const totalTravel = windowHeight * scrollRange + rect.height;
      const distFromBottom = windowHeight - rect.top;
      const progress = Math.max(0, Math.min(1, distFromBottom / totalTravel));

      video.currentTime = progress * video.duration;
    };

    const handleScroll = () => {
      requestAnimationFrame(updateVideoTime);
    };

    video.addEventListener("loadedmetadata", handleMetadata);
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial position
    updateVideoTime();

    return () => {
      video.removeEventListener("loadedmetadata", handleMetadata);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrollRange]);

  return (
    <div ref={containerRef} className={className}>
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-contain pointer-events-none"
        // Prevent autoplay — we control time via scroll
      />
    </div>
  );
}
