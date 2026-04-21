"use client";

import { useEffect, useRef, useCallback, useState, type ReactNode } from "react";

interface ScrollVideoHeroProps {
  src: string;
  name: string;
  subtitle: string;
  description: string;
  textPosition?: "left" | "right";
  accentColor?: string;
  /** Scroll distance as viewport-height multiplier. Longer = slower, more cinematic scrub. */
  scrollLength?: number;
  /** Mobile-specific scroll length. Mobile viewports are taller relative to width,
   *  so a desktop scrollLength creates oceans of white space on phones. Defaults to
   *  min(scrollLength, 1.4) — keeps the scrub feeling tight on mobile. */
  mobileScrollLength?: number;
  /** Optional custom overlay that replaces the default name/subtitle/description block. */
  overlay?: ReactNode;
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
  scrollLength = 3,
  mobileScrollLength,
  overlay,
}: ScrollVideoHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const cachedRect = useRef({ top: 0, height: 0 });
  const isSeekingRef = useRef(false);
  const pendingProgressRef = useRef<number | null>(null);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);

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

    const imgRatio = video.videoWidth / video.videoHeight;
    const canvasRatio = displayW / displayH;

    // object-cover: video always fills the viewport, no letterbox gaps
    let drawW: number, drawH: number;
    if (imgRatio > canvasRatio) {
      drawH = displayH;
      drawW = displayH * imgRatio;
    } else {
      drawW = displayW;
      drawH = displayW / imgRatio;
    }
    const drawX = (displayW - drawW) / 2;
    const drawY = (displayH - drawH) / 2;

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

    // Mobile seeks are much slower than desktop — coalesce updates more aggressively
    const isTouchMobile =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(pointer: coarse)").matches ||
        window.innerWidth < 768);
    // Minimum frame-time delta before issuing a new seek. Larger = smoother on mobile
    // at the cost of coarser scrubbing precision.
    const MIN_SEEK_DELTA_S = isTouchMobile ? 0.06 : 0.01;

    const scrubToProgress = (progress: number) => {
      if (!video.duration || !isFinite(video.duration)) return;

      const targetTime = progress * video.duration;

      if (isSeekingRef.current) {
        // Store latest pending progress; commit after seek settles
        pendingProgressRef.current = progress;
        return;
      }

      // Skip micro-seeks below the mobile-safe threshold — prevents seek storm jank
      if (Math.abs(targetTime - video.currentTime) < MIN_SEEK_DELTA_S) return;

      isSeekingRef.current = true;
      video.currentTime = targetTime;
    };

    const updateTargetFromScroll = () => {
      const { top, height } = cachedRect.current;
      const viewportH = window.innerHeight;
      const scrollRange = height - viewportH;
      if (scrollRange <= 0) return;

      const scrolled = window.scrollY - top;
      targetProgressRef.current = Math.max(
        0,
        Math.min(1, scrolled / scrollRange),
      );
    };

    // Lerp smoothing — eases displayed progress toward scroll target each frame.
    // Lower smoothing on mobile = fewer, chunkier seeks = less jank.
    const SMOOTHING = isTouchMobile ? 0.22 : 0.12;
    const EPSILON = isTouchMobile ? 0.002 : 0.0005;

    const scrub = () => {
      const target = targetProgressRef.current;
      const current = currentProgressRef.current;
      const diff = target - current;
      const next =
        Math.abs(diff) < EPSILON ? target : current + diff * SMOOTHING;
      currentProgressRef.current = next;

      scrubToProgress(next);

      // Text fade — fully visible at scroll=0 when a custom overlay owns the section.
      // On mobile, text is always visible (matches ScrollImageHero behavior) — the
      // fade-from-0 at scroll start was making section titles invisible when users
      // first land on the section.
      if (text) {
        if (isTouchMobile) {
          text.style.opacity = "1";
          text.style.transform = "translate3d(0,0,0)";
        } else {
          const textOpacity = overlay
            ? next > 0.85
              ? (1 - next) / 0.15
              : 1
            : next < 0.05
              ? next / 0.05
              : next > 0.85
                ? (1 - next) / 0.15
                : 1;
          const textY = overlay ? 0 : (1 - Math.min(1, next / 0.1)) * 30;
          text.style.opacity = String(Math.max(0, Math.min(1, textOpacity)));
          text.style.transform = `translate3d(0,${textY}px,0)`;
        }
      }

      // Keep animating while we haven't caught up to the scroll target
      if (Math.abs(target - next) > EPSILON) {
        rafRef.current = requestAnimationFrame(scrub);
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
      updateTargetFromScroll();
      // Snap on first paint so the initial frame matches scroll position
      currentProgressRef.current = targetProgressRef.current;
      drawCurrentFrame();
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(scrub);
    };

    video.addEventListener("seeked", onSeeked);
    video.addEventListener("loadeddata", onLoadedData);
    if (video.readyState >= 2) onLoadedData();

    const handleScroll = () => {
      updateTargetFromScroll();
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(scrub);
    };

    // iOS fires resize during address-bar collapse — debounce to avoid re-caching
    // the rect mid-scroll (which would cause a visible hitch).
    let resizeTimer: number | undefined;
    const handleResize = () => {
      if (resizeTimer !== undefined) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        cacheRect();
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
        updateTargetFromScroll();
        currentProgressRef.current = targetProgressRef.current;
        drawCurrentFrame();
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(scrub);
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    updateTargetFromScroll();
    requestAnimationFrame(scrub);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (resizeTimer !== undefined) window.clearTimeout(resizeTimer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("loadeddata", onLoadedData);
      video.src = "";
      videoRef.current = null;
    };
  }, [cacheRect, drawCurrentFrame, src]);

  const isLeft = textPosition === "left";
  const desktopLen = Math.max(1.2, scrollLength);
  const mobileLen = Math.max(1.2, mobileScrollLength ?? Math.min(scrollLength, 1.4));
  const [isMobileVP, setIsMobileVP] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobileVP(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  const activeLen = isMobileVP ? mobileLen : desktopLen;
  // Container height changes when mobile/desktop toggles — re-cache rect so
  // the scroll-progress math doesn't use stale values.
  useEffect(() => {
    cacheRect();
  }, [activeLen, cacheRect]);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{
        marginTop: "-2px",
        marginBottom: "-2px",
        height: `${activeLen * 100}vh`,
      }}
    >
      {/* Sticky viewport — full screen on all breakpoints, no dead space */}
      <div
        className="sticky top-0 h-[100dvh] overflow-hidden bg-white"
        style={{ willChange: "transform", contain: "paint" }}
      >
        {/* Canvas — painted from video frames, GPU-accelerated */}
        <canvas
          ref={canvasRef}
          aria-label={`${name} mascot animation`}
          role="img"
          className="absolute inset-0 w-full h-full"
          style={{ transform: "translateZ(0)" }}
        />

        {/* Fade-to-white at bottom edge so the viewport dissolves into the next section */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 md:h-40 bg-gradient-to-b from-transparent to-white"
        />

        {/* Text overlay — anchored to bottom on mobile, centered on desktop */}
        {overlay ? (
          <div
            ref={textRef}
            className="absolute inset-0 z-10"
            style={{ opacity: 1, transform: "translate3d(0,0,0)" }}
          >
            {overlay}
          </div>
        ) : (
          <div
            className={`absolute inset-0 flex items-end md:items-center pb-10 md:pb-0 ${
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
              {/* Soft background wash behind text for legibility over video */}
              <div
                className={`absolute inset-0 -mx-8 -my-10 md:-my-16 ${
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
        )}
      </div>
    </div>
  );
}
