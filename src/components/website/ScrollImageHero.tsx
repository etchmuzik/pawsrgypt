"use client";

import React, { useEffect, useRef, useCallback } from "react";

interface ScrollImageHeroProps {
  /** Directory path containing frame-001.jpg … frame-NNN.jpg */
  framesPath: string;
  /** Total number of frames in the sequence */
  frameCount: number;
  name: string;
  subtitle: string;
  description: string;
  textPosition?: "left" | "right";
  accentColor?: string;
  /**
   * CSS mix-blend-mode for the canvas element.
   * Use "multiply" when frames have a pure-white background to make
   * the character appear to float with no background.
   */
  canvasBlendMode?: string;
  /** Background color of the sticky section. Default: "#fafafa" */
  sectionBg?: string;
}

/**
 * Scroll-driven image-sequence hero using <canvas>.
 *
 * Desktop: canvas fills full viewport, text overlaid left or right with
 *   a gradient wash behind it. Text fades in/out on scroll.
 *
 * Mobile: canvas fills full viewport (no split layout), text is pinned
 *   to the bottom of the frame with a dark gradient for legibility.
 *   Text is always visible — no fade/opacity animation on mobile.
 */
export function ScrollImageHero({
  framesPath,
  frameCount,
  name,
  subtitle,
  description,
  textPosition = "left",
  accentColor = "text-paws-orange",
  canvasBlendMode,
  sectionBg = "#fafafa",
}: ScrollImageHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const cachedRect = useRef({ top: 0, height: 0 });
  const currentFrame = useRef(-1);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const loadedCount = useRef(0);

  const cacheRect = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    cachedRect.current = {
      top: rect.top + window.scrollY,
      height: rect.height,
    };
  }, []);

  /** Draw a specific frame onto the canvas, fitting it with contain (mobile) or cover (desktop). */
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = imagesRef.current[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;

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
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = displayW / displayH;

    let drawW: number, drawH: number, drawX: number, drawY: number;

    if (isMobile) {
      // object-contain on mobile: show the full mascot, centered
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
      // object-cover on desktop: fill canvas, anchor top-center
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

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }, []);

  useEffect(() => {
    cacheRect();

    // Preload all frames
    const images: HTMLImageElement[] = [];
    for (let i = 0; i < frameCount; i++) {
      const num = String(i + 1).padStart(3, "0");
      const img = new Image();
      img.src = `${framesPath}/frame-${num}.jpg`;
      img.onload = () => {
        loadedCount.current++;
        if (i === 0) {
          currentFrame.current = 0;
          drawFrame(0);
        }
      };
      images.push(img);
    }
    imagesRef.current = images;

    const text = textRef.current;

    const scrub = () => {
      const { top, height } = cachedRect.current;
      const viewportH = window.innerHeight;
      const scrollRange = height - viewportH;
      if (scrollRange <= 0) return;

      const scrolled = window.scrollY - top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollRange));

      // Frame selection
      const frameIndex = Math.min(
        frameCount - 1,
        Math.floor(progress * frameCount)
      );
      if (frameIndex !== currentFrame.current) {
        currentFrame.current = frameIndex;
        drawFrame(frameIndex);
      }

      // Text animation: desktop only — mobile text is always visible
      if (text) {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          text.style.opacity = "1";
          text.style.transform = "translate3d(0,0,0)";
        } else {
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
      }
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(scrub);
    };

    const handleResize = () => {
      cacheRect();
      if (currentFrame.current >= 0) {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
        drawFrame(currentFrame.current);
      }
      scrub();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    requestAnimationFrame(scrub);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [cacheRect, frameCount, framesPath, drawFrame]);

  const isLeft = textPosition === "left";

  return (
    <div
      ref={containerRef}
      /* h-[180vh] on mobile gives ~80vh of scroll range (was 20vh) — enough
         for the animation to feel intentional. Desktop keeps 200vh. */
      className="h-[180vh] md:h-[200vh] relative"
      style={{ marginTop: "-2px", marginBottom: "-2px" }}
    >
      {/* Sticky viewport — canvas fills 100% on all sizes */}
      <div
        className="sticky top-0 h-[100dvh] overflow-hidden"
        style={{ backgroundColor: sectionBg }}
      >
        {/* Canvas — always fills the entire sticky panel */}
        <canvas
          ref={canvasRef}
          aria-label={`${name} mascot animation`}
          role="img"
          className="absolute inset-0 w-full h-full"
          style={
            canvasBlendMode
              ? { mixBlendMode: canvasBlendMode as React.CSSProperties["mixBlendMode"] }
              : undefined
          }
        />

        {/* ── Mobile gradient: bottom fade for text legibility ── */}
        <div className="md:hidden absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        {/* ── Text overlay ── */}
        <div
          className={`absolute inset-0 flex items-end md:items-center pb-8 md:pb-0 ${
            isLeft ? "justify-start" : "justify-end"
          }`}
        >
          <div
            ref={textRef}
            className={`relative z-10 w-full md:w-1/2 lg:w-1/2 px-5 sm:px-8 md:px-16 lg:px-20 ${
              isLeft ? "text-left" : "md:text-right text-left"
            }`}
            /* No initial opacity:0 — scrub() sets the correct value immediately
               on mount. On mobile scrub() always sets opacity:1. */
          >
            {/* Desktop gradient wash behind text */}
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
                className={`text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] ${accentColor} mb-1 md:mb-4 drop-shadow-sm`}
              >
                {subtitle}
              </p>
              <h2 className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter leading-none text-white md:text-neutral-900 mb-2 md:mb-6 drop-shadow-md md:drop-shadow-none">
                {name}
              </h2>
              <p className="text-sm sm:text-lg md:text-xl text-white/90 md:text-neutral-500 leading-relaxed max-w-[45ch] drop-shadow-sm md:drop-shadow-none">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
