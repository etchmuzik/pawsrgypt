"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface ProductCardZoomProps {
  href: string;
  src: string;
  alt: string;
  outOfStock?: boolean;
  zoom?: number; // background-size multiplier
  children: React.ReactNode; // the rest of the card (text/price)
  badge?: React.ReactNode; // featured / out-of-stock badge
}

/**
 * Shop list card with hover-zoom.
 *
 * Desktop: hovering the image shows a small floating "magnifier" panel pinned
 *   to the card showing a zoomed crop that follows the cursor — like a real
 *   in-store inspection. The card itself remains a clickable Link so a normal
 *   click still goes to the product detail page.
 * Mobile: no zoom panel, plain card behavior.
 */
export function ProductCardZoom({
  href,
  src,
  alt,
  outOfStock = false,
  zoom = 2.5,
  children,
  badge,
}: ProductCardZoomProps) {
  const imgRef = useRef<HTMLDivElement | null>(null);
  const [hovering, setHovering] = useState(false);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = imgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setPos({
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    });
  }

  return (
    <Link
      href={href}
      className="bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 group block relative"
    >
      <div
        ref={imgRef}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={handleMove}
        className="bg-neutral-50 aspect-square flex items-center justify-center relative overflow-hidden md:cursor-zoom-in"
      >
        <Image
          src={src}
          alt={alt}
          width={400}
          height={400}
          className={`w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 ${outOfStock ? "opacity-50 grayscale" : ""}`}
        />
        {badge}

        {hovering && !outOfStock && (
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-2 right-2 w-32 h-32 rounded-xl border-2 border-paws-orange/40 bg-white shadow-lg overflow-hidden pointer-events-none z-10"
          >
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url("${src}")`,
                backgroundRepeat: "no-repeat",
                backgroundColor: "#fafafa",
                backgroundSize: `${zoom * 100}%`,
                backgroundPosition: `${pos.x * 100}% ${pos.y * 100}%`,
              }}
            />
          </div>
        )}
      </div>
      {children}
    </Link>
  );
}
