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

export function ScrollVideoHero({
  src,
  name,
  subtitle,
  description,
  textPosition = "left",
  accentColor = "text-paws-orange",
}: ScrollVideoHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const cachedRect = useRef({ top: 0, height: 0 });
  const currentTimeRef = useRef(0);

  const cacheRect = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    cachedRect.current = {
      top: rect.top + window.scrollY,
      height: rect.height,
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const text = textRef.current;
    if (!video) return;

    cacheRect();

    // Smooth interpolation — lerp toward target time instead of jumping
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const scrub = () => {
      const { top, height } = cachedRect.current;
      const viewportH = window.innerHeight;
      const scrollRange = height - viewportH;
      if (scrollRange <= 0) return;

      const scrolled = window.scrollY - top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollRange));

      // Smooth video scrubbing with lerp
      if (video.duration && isFinite(video.duration)) {
        const targetTime = progress * video.duration;
        currentTimeRef.current = lerp(currentTimeRef.current, targetTime, 0.35);
        video.currentTime = currentTimeRef.current;
      }

      // Smooth text fade
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

      // Keep animating if we haven't converged
      if (video.duration && isFinite(video.duration)) {
        const targetTime = progress * video.duration;
        if (Math.abs(currentTimeRef.current - targetTime) > 0.01) {
          rafRef.current = requestAnimationFrame(scrub);
        }
      }
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(scrub);
    };

    const handleResize = () => {
      cacheRect();
      scrub();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    const onMeta = () => {
      cacheRect();
      currentTimeRef.current = 0;
      scrub();
    };
    video.addEventListener("loadedmetadata", onMeta);
    if (video.readyState >= 1) onMeta();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      video.removeEventListener("loadedmetadata", onMeta);
    };
  }, [cacheRect]);

  const isLeft = textPosition === "left";

  return (
    <div
      ref={containerRef}
      className="h-[120vh] md:h-[200vh] relative"
      style={{ marginTop: "-2px", marginBottom: "-2px" }}
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-[100dvh] overflow-hidden bg-white flex flex-col md:block">
        {/* Video — contain on mobile (show full), cover on desktop (immersive) */}
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="auto"
          className="md:absolute md:w-full md:h-full object-contain md:object-cover object-center md:object-top will-change-transform w-full h-[60dvh] md:h-full shrink-0"
        />

        {/* Text overlay — below video on mobile, over video on desktop */}
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
