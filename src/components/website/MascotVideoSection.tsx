"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Full-width mascot video section with scroll-driven playback.
 * As the user scrolls, both Cairo and Luna videos scrub forward seamlessly.
 * The videos are side by side on desktop, stacked on mobile.
 */
export function MascotVideoSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cairoRef = useRef<HTMLVideoElement>(null);
  const lunaRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const cairo = cairoRef.current;
    const luna = lunaRef.current;
    if (!section || !cairo || !luna) return;

    let cairoReady = false;
    let lunaReady = false;

    const checkReady = () => {
      if (cairoReady && lunaReady) {
        setIsReady(true);
        scrub();
      }
    };

    cairo.addEventListener("loadedmetadata", () => {
      cairoReady = true;
      checkReady();
    });
    luna.addEventListener("loadedmetadata", () => {
      lunaReady = true;
      checkReady();
    });

    // If already loaded (cached)
    if (cairo.readyState >= 1) {
      cairoReady = true;
      checkReady();
    }
    if (luna.readyState >= 1) {
      lunaReady = true;
      checkReady();
    }

    const scrub = () => {
      if (!cairo.duration || !luna.duration) return;

      const rect = section.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Section travels from entering viewport bottom to leaving viewport top
      const totalTravel = windowH + rect.height;
      const distFromBottom = windowH - rect.top;
      const progress = Math.max(0, Math.min(1, distFromBottom / totalTravel));

      cairo.currentTime = progress * cairo.duration;
      luna.currentTime = progress * luna.duration;
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(scrub);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    scrub();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-gradient-to-b from-white via-paws-cream/30 to-white overflow-hidden"
    >
      {/* Section header */}
      <div className="text-center pt-16 pb-8 px-4">
        <span className="text-paws-orange font-semibold text-sm uppercase tracking-wider">
          Watch Them Come to Life
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-paws-brown-dark mt-2">
          Scroll to Animate
        </h2>
        <p className="text-paws-brown/60 mt-2 text-sm">
          Scroll down and watch Cairo & Luna move!
        </p>
        <div className="w-16 h-1 bg-paws-orange rounded-full mx-auto mt-4" />
      </div>

      {/* Video grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div
          className={`grid md:grid-cols-2 gap-8 transition-opacity duration-700 ${
            isReady ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Cairo video */}
          <div className="relative group">
            <div className="relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-orange-50 to-paws-cream border border-orange-100/50">
              <video
                ref={cairoRef}
                src="/mascots/cairo.mp4"
                muted
                playsInline
                preload="auto"
                className="w-full aspect-square object-contain"
              />
              {/* Overlay label */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg">
                <span className="font-bold text-paws-brown-dark text-sm">
                  Cairo
                </span>
                <span className="text-paws-orange text-xs ml-2">
                  The Explorer
                </span>
              </div>
            </div>
            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-paws-orange/5 rounded-[2rem] -z-10 blur-xl group-hover:bg-paws-orange/10 transition-colors" />
          </div>

          {/* Luna video */}
          <div className="relative group">
            <div className="relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-emerald-50 to-green-50/30 border border-emerald-100/50">
              <video
                ref={lunaRef}
                src="/mascots/luna.mp4"
                muted
                playsInline
                preload="auto"
                className="w-full aspect-square object-contain"
              />
              {/* Overlay label */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg">
                <span className="font-bold text-paws-brown-dark text-sm">
                  Luna
                </span>
                <span className="text-emerald-500 text-xs ml-2">
                  The Wise One
                </span>
              </div>
            </div>
            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-emerald-500/5 rounded-[2rem] -z-10 blur-xl group-hover:bg-emerald-500/10 transition-colors" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mt-10">
          <div className="flex flex-col items-center text-paws-brown/40 animate-bounce">
            <span className="text-xs font-medium mb-1">Keep scrolling</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Floating paw decoration */}
      <div className="absolute top-20 left-8 text-5xl opacity-5 animate-float-slow">
        🐾
      </div>
      <div
        className="absolute bottom-32 right-12 text-5xl opacity-5 animate-float"
        style={{ animationDelay: "1.5s" }}
      >
        🐾
      </div>
    </section>
  );
}
