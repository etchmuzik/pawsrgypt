"use client";

import { useEffect, useRef, useCallback } from "react";

interface ScrollVideoHeroProps {
  src: string;
  name: string;
  subtitle: string;
  description: string;
  textPosition?: "left" | "right";
  accentColor?: string;
}

/**
 * Scroll-driven video hero using <canvas>.
 * Seeks the video to the correct time on every scroll tick, then
 * paints the current video frame onto a canvas — same feel as
 * ScrollImageHero but using a single video file instead of 96 PNGs.
 * Works great with transparent-background videos (WebM/HEVC alpha).
 */
export function ScrollVideoHero({
  src,
  name,
  subtitle,
  description,
  textPosition = "left",
  accentColor = "text-paws-orange",
}: ScrollVideoHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const cachedRect = useRef({ top: 0, height: 0 });
  const isSeekingRef = useRef(false);
  const pendingProgressRef = useRef<number | null>(null);

  const cacheRect = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    cachedRect.current = {
      top: rect.top + window.scrollY,
      height: rect.height,
    };
  }, []);

  /** Draw the current video frame onto the canvas with contain/cover logic */
  const drawCurrentFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayW = canvas.clientWidth;
    const displayH = canvas.clientHeight;

    if (canvas.width !== displayW * dpr || canvas.height !== displayH * dpr) {
      canvas.width = displayW * dpr;
      canvas.height = displayH * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, displayW, displayH);

    const isMobile = window.innerWidth < 768;
    const imgRatio = video.videoWidth / video.videoHeight;
    const canvasRatio = displayW / displayH;

    let drawW: number, drawH: number, drawX: number, drawY: number;

    if (isMobile) {
      // object-contain: show full mascot
      if (imgRatio > canvasRatio) {
        drawW = displayW;
        drawH = displayW / imgRatio;
      } else {
        drawH = displayH;
        drawW = displayH * imgRatio;
      }
      drawX = (displayW - drawW) / 2;
      drawY = (displayH - drawH) / 2;
    } else {
      // object-cover anchored top-center
      if (imgRatio > canvasRatio) {
        drawH = displayH;
        drawW = displayH * imgRatio;
      } else {
        drawW = displayW;
        drawH = displayW / imgRatio;
      }
      drawX = (displayW - drawW) / 2;
      drawY = 0;
    }

    ctx.drawImage(video, drawX, drawY, drawW, drawH);
  }, []);

  useEffect(() => {
    // Create the off-screen video element — never inserted into the DOM
    const video = document.createElement("video");
    video.src = src;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    videoRef.current = video;

    cacheRect();

    const text = textRef.current;

    const scrubToProgress = (progress: number) => {
      if (!video.duration || !isFinite(video.duration)) return;

      const targetTime = progress * video.duration;

      if (isSeekingRef.current) {
        // Store latest pending progress; commit after seek settles
        pendingProgressRef.current = progress;
        return;
      }

      isSeekingRef.current = true;
      video.currentTime = targetTime;
    };

    const scrub = () => {
      const { top, height } = cachedRect.current;
      const viewportH = window.innerHeight;
      const scrollRange = height - viewportH;
      if (scrollRange <= 0) return;

      const scrolled = window.scrollY - top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollRange));

      scrubToProgress(progress);

      // Text fade — identical to ScrollImageHero
      if (text) {
        const textOpacity =
          progress < 0.05
            ? progress / 0.05
            : progress > 0.85
              ? (1 - progress) / 0.15
              : 1;
        const textY = (1 - Math.min(1, progress / 0.1)) * 30;
        text.style.opacity = String(Math.max(0, Math.min(1, textOpacity)));
        text.style.transform = `translate3d(0,${textY}px,0)`;
      }
    };

    // After each seek completes, paint the frame then process any queued scrub
    const onSeeked = () => {
      drawCurrentFrame();
      const pending = pendingProgressRef.current;
      pendingProgressRef.current = null;

      if (pending !== null && video.duration && isFinite(video.duration)) {
        video.currentTime = pending * video.duration;
        // isSeekingRef stays true — another seeked will fire
      } else {
        isSeekingRef.current = false;
      }
    };

    const onLoadedData = () => {
      cacheRect();
      drawCurrentFrame();
      scrub();
    };

    video.addEventListener("seeked", onSeeked);
    video.addEventListener("loadeddata", onLoadedData);
    if (video.readyState >= 2) onLoadedData();

    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(scrub);
    };

    const handleResize = () => {
      cacheRect();
      // Reset canvas size
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
      drawCurrentFrame();
      scrub();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    requestAnimationFrame(scrub);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("loadeddata", onLoadedData);
      video.src = "";
      videoRef.current = null;
    };
  }, [cacheRect, drawCurrentFrame, src]);

  const isLeft = textPosition === "left";

  return (
    <div
      ref={containerRef}
      className="h-[120vh] md:h-[200vh] relative"
      style={{ marginTop: "-2px", marginBottom: "-2px" }}
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-[100dvh] overflow-hidden bg-white flex flex-col md:block">
        {/* Canvas — painted from video frames, GPU-accelerated */}
        <canvas
          ref={canvasRef}
          aria-label={`${name} mascot animation`}
          role="img"
          className="w-full h-[60dvh] md:h-full shrink-0 md:absolute md:inset-0"
        />

        {/* Text overlay — below canvas on mobile, over canvas on desktop */}
        <div
          className={`relative md:absolute md:inset-0 flex items-start md:items-center pt-4 pb-6 md:pt-0 md:pb-0 bg-white md:bg-transparent ${
            isLeft ? "justify-start" : "justify-end"
          }`}
        >
          <div
            ref={textRef}
            className={`relative z-10 w-full lg:w-1/2 px-5 sm:px-8 md:px-16 lg:px-20 ${
              isLeft ? "text-left" : "md:text-right text-left"
            }`}
            style={{ opacity: 0, transform: "translate3d(0,30px,0)" }}
          >
            {/* Soft background wash behind text — desktop only */}
            <div
              className={`hidden md:block absolute inset-0 -mx-8 -my-16 ${
                isLeft
                  ? "bg-gradient-to-r from-white/95 via-white/80 to-transparent"
                  : "bg-gradient-to-l from-white/95 via-white/80 to-transparent"
              }`}
              style={{ backdropFilter: "blur(2px)" }}
            />

            <div className="relative">
              <p
                className={`text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] ${accentColor} mb-1 md:mb-4`}
              >
                {subtitle}
              </p>
              <h2 className="text-2xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter leading-none text-neutral-900 mb-2 md:mb-6">
                {name}
              </h2>
              <p className="text-sm sm:text-lg md:text-xl text-neutral-500 leading-relaxed max-w-[45ch]">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
