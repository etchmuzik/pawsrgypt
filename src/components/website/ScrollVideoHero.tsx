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
  const stickyRef = useRef<HTMLDivElement>(null);
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

      // Scrub video
      if (video.duration && isFinite(video.duration)) {
        video.currentTime = progress * video.duration;
      }

      // Fade text: visible between 5%–85% progress
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

    // Initial scrub once video metadata loads
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
      {/* Sticky viewport-filling container */}
      <div
        ref={stickyRef}
        className="sticky top-0 min-h-[100dvh] overflow-hidden flex items-center bg-white"
      >
        <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12">
          <div
            className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center ${
              isLeft ? "" : "lg:[direction:rtl]"
            }`}
          >
            {/* Text side */}
            <div
              ref={textRef}
              className={`will-change-transform transition-none ${
                isLeft ? "lg:[direction:ltr]" : "lg:[direction:ltr]"
              } text-center lg:text-left`}
              style={{ opacity: 0, transform: "translateY(40px)" }}
            >
              <p
                className={`text-sm font-semibold uppercase tracking-[0.2em] ${accentColor} mb-4`}
              >
                {subtitle}
              </p>
              <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none text-neutral-900 mb-6">
                {name}
              </h2>
              <p className="text-lg md:text-xl text-neutral-500 leading-relaxed max-w-[50ch] mx-auto lg:mx-0">
                {description}
              </p>
            </div>

            {/* Video side */}
            <div className="flex items-center justify-center">
              <video
                ref={videoRef}
                src={src}
                muted
                playsInline
                preload="auto"
                className="w-full max-w-[600px] lg:max-w-none aspect-square object-contain will-change-transform mix-blend-multiply"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
