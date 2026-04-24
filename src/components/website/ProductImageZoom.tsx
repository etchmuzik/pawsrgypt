"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface ProductImageZoomProps {
  src: string;
  alt: string;
  zoom?: number; // zoom factor, e.g. 2 = 200%
  lensSize?: number; // lens square size in px
}

/**
 * Hover-zoom: shows a small lens that tracks the cursor on the main image
 * and renders a magnified view in a side panel that appears on desktop.
 * On touch devices nothing extra renders — users see the plain image.
 */
export function ProductImageZoom({
  src,
  alt,
  zoom = 2.2,
  lensSize = 140,
}: ProductImageZoomProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hovering, setHovering] = useState(false);
  // Fractional position of cursor inside container (0..1)
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setPos({
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    });
  }

  const lensHalf = lensSize / 2;

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={handleMove}
        className="relative bg-neutral-50 rounded-3xl overflow-hidden border border-neutral-100 cursor-zoom-in"
      >
        <div className="aspect-square flex items-center justify-center p-8">
          <Image
            src={src}
            alt={alt}
            width={600}
            height={600}
            className="w-full h-full object-contain pointer-events-none select-none"
            priority
          />
        </div>

        {hovering && (
          <div
            aria-hidden="true"
            className="hidden md:block absolute border-2 border-paws-orange/70 bg-paws-orange/10 rounded-lg pointer-events-none transition-none"
            style={{
              width: lensSize,
              height: lensSize,
              left: `calc(${pos.x * 100}% - ${lensHalf}px)`,
              top: `calc(${pos.y * 100}% - ${lensHalf}px)`,
            }}
          />
        )}
      </div>

      {hovering && (
        <div
          aria-hidden="true"
          className="hidden md:block absolute top-0 left-full ml-4 w-[420px] h-[420px] rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-xl z-20"
        >
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url("${src}")`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${zoom * 100}%`,
              backgroundPosition: `${pos.x * 100}% ${pos.y * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
