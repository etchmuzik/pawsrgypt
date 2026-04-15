import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TextHeroProps {
  locale: string;
  title: string;
  subtitle: string;
  tagline: string;
  ctaText: string;
}

export function TextHero({
  locale,
  title,
  subtitle,
  tagline,
  ctaText,
}: TextHeroProps) {
  return (
    <section className="min-h-[100dvh] bg-white flex items-center relative overflow-hidden">
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-8 items-center">
          {/* Text side — left */}
          <div className="text-center lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-paws-orange mb-6">
              {tagline}
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-none text-neutral-900 mb-8">
              {title}
            </h1>
            <p className="text-lg md:text-xl text-neutral-500 leading-relaxed max-w-[55ch] mx-auto lg:mx-0 mb-10">
              {subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href={`/${locale}/shop`}>
                <Button
                  size="lg"
                  className="bg-paws-orange hover:bg-paws-orange/90 text-white font-bold px-8 shadow-[0_8px_30px_rgba(244,124,44,0.25)] hover:shadow-[0_12px_40px_rgba(244,124,44,0.35)] transition-all hover:scale-[1.02]"
                >
                  {ctaText}
                  <ArrowRight className="w-5 h-5 ms-2" />
                </Button>
              </Link>
            </div>

            {/* Minimal social proof */}
            <div className="mt-12 flex items-center gap-3 justify-center lg:justify-start text-sm text-neutral-400">
              <div className="flex -space-x-2">
                {[
                  { initials: "SA", bg: "bg-paws-orange" },
                  { initials: "MK", bg: "bg-emerald-500" },
                  { initials: "NR", bg: "bg-sky-500" },
                  { initials: "LE", bg: "bg-purple-500" },
                ].map((avatar) => (
                  <div
                    key={avatar.initials}
                    className={`w-8 h-8 rounded-full ${avatar.bg} border-2 border-white flex items-center justify-center text-[10px] font-bold text-white`}
                  >
                    {avatar.initials}
                  </div>
                ))}
              </div>
              <span>
                <span className="font-semibold text-neutral-600">2,000+</span>{" "}
                happy pet parents
              </span>
            </div>
          </div>

          {/* Image side — right */}
          <div className="flex items-center justify-center relative">
            <div className="relative w-full max-w-[720px]">
              <Image
                src="/mascots/cairo-luna.jpeg"
                alt="Cairo & Luna — PAWS Egypt mascots"
                width={1024}
                height={576}
                className="w-full h-auto object-contain"
                priority
              />
              {/* Subtle scroll hint */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-neutral-300">
                <span className="text-xs font-medium tracking-wider uppercase mb-1">
                  Scroll
                </span>
                <svg
                  className="w-4 h-4 animate-bounce"
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
        </div>
      </div>
    </section>
  );
}
