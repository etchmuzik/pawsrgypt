import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroVideoOverlayProps {
  locale: string;
  title: string;
  subtitle: string;
  tagline: string;
  ctaText: string;
}

export function HeroVideoOverlay({
  locale,
  title,
  subtitle,
  tagline,
  ctaText,
}: HeroVideoOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-start md:items-center pt-8 sm:pt-12 md:pt-0">
      <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-8 md:px-16 lg:px-20">
        <div className="relative max-w-[640px]">
          {/* Soft wash for legibility over video */}
          <div
            aria-hidden
            className="absolute inset-0 -mx-6 -my-8 md:-mx-10 md:-my-14 rounded-3xl bg-gradient-to-r from-white/95 via-white/80 to-transparent"
            style={{ backdropFilter: "blur(2px)" }}
          />

          <div className="relative text-left">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-paws-orange mb-3 sm:mb-5">
              {tagline}
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tighter leading-[1.05] text-neutral-900 mb-5 sm:mb-7">
              {title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-neutral-600 leading-relaxed max-w-[55ch] mb-6 sm:mb-8">
              {subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
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
            <div className="mt-8 flex items-center gap-3 text-sm text-neutral-500">
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
                <span className="font-semibold text-neutral-700">2,000+</span>{" "}
                happy pet parents
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
