"use client";

import { useEffect, useRef, useCallback } from "react";

interface ScrollVideoHeroProps {
  src: string;
  name: string;
  subtitle: string;
  description: string;
  /** Which side the text appears on desktop */
  textPosition?: "left" | "right";
  /** Accent color for the name */
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

    const scrub = () => {
      const { top, height } = cachedRect.current;
      const viewportH = window.innerHeight;
      const scrollRange = height - viewportH;
      if (scrollRange <= 0) return;

      const scrolled = window.scrollY - top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollRange));

      if (video.duration && isFinite(video.duration)) {
        video.currentTime = progress * video.duration;
      }

      if (text) {
        const textOpacity =
          progress < 0.05
            ? progress / 0.05
            : progress > 0.85
              ? (1 - progress) / 0.15
              : 1;
        const textY = (1 - Math.min(1, progress / 0.1)) * 40;
        text.style.opacity = String(Math.max(0, Math.min(1, textOpacity)));
        text.style.transform = `translateY(${textY}px)`;
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
      className="h-[200vh] md:h-[300vh] relative"
    >
      {/* Sticky viewport — video fills entire screen */}
      <div className="sticky top-0 min-h-[100dvh] overflow-hidden bg-white">
        {/* Video — absolute, fills entire viewport */}
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover will-change-transform ${
            isLeft ? "object-right" : "object-left"
          }`}
        />

        {/* Text overlay — positioned on one side with bg fade for readability */}
        <div
          className={`absolute inset-0 flex items-center ${
            isLeft ? "justify-start" : "justify-end"
          }`}
        >
          <div
            ref={textRef}
            className={`relative z-10 w-full lg:w-1/2 px-8 md:px-16 lg:px-20 ${
              isLeft ? "text-left" : "text-right"
            }`}
            style={{ opacity: 0, transform: "translateY(40px)" }}
          >
            {/* Soft background wash behind text for readability */}
            <div
              className={`absolute inset-0 -mx-8 -my-12 ${
                isLeft
                  ? "bg-gradient-to-r from-white via-white/90 to-transparent"
                  : "bg-gradient-to-l from-white via-white/90 to-transparent"
              }`}
            />

            <div className="relative">
              <p
                className={`text-sm font-semibold uppercase tracking-[0.2em] ${accentColor} mb-4`}
              >
                {subtitle}
              </p>
              <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none text-neutral-900 mb-6">
                {name}
              </h2>
              <p className="text-lg md:text-xl text-neutral-500 leading-relaxed max-w-[45ch]">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
