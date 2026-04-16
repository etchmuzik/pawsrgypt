"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { ScrollReveal } from "@/components/website/ScrollReveal";
import { ScrollImageHero } from "@/components/website/ScrollImageHero";
import { ScrollVideoHero } from "@/components/website/ScrollVideoHero";
import { TextHero } from "@/components/website/TextHero";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Star,
  Truck,
  Shield,
  Heart,
  Sparkles,
  UtensilsCrossed,
  Gem,
  Gamepad2,
  HeartPulse,
  BedDouble,
} from "lucide-react";

/* ================================================
   TRUST BAR — Minimal icons on white
   ================================================ */
function TrustBar() {
  const features = [
    { icon: Truck, text: "Free Cairo Delivery" },
    { icon: Shield, text: "Premium Quality" },
    { icon: Heart, text: "Pet-First Care" },
    { icon: Sparkles, text: "Trusted Brands" },
  ];

  return (
    <section className="bg-white py-8 md:py-12 border-b border-neutral-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {features.map(({ icon: Icon, text }, i) => (
            <ScrollReveal key={text} delay={i * 80}>
              <div className="flex items-center justify-center gap-3 group cursor-default">
                <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:text-paws-orange group-hover:scale-110 transition-all">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-neutral-700">
                  {text}
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================
   CATEGORIES — Lucide icons, clean white cards
   ================================================ */
function CategoriesSection() {
  const t = useTranslations("home");
  const locale = useLocale();

  const categories = [
    { name: "Food & Treats", nameAr: "أطعمة ومكافآت", icon: UtensilsCrossed, color: "text-orange-500 bg-orange-50 group-hover:bg-orange-100" },
    { name: "Accessories", nameAr: "إكسسوارات", icon: Gem, color: "text-pink-500 bg-pink-50 group-hover:bg-pink-100" },
    { name: "Toys", nameAr: "ألعاب", icon: Gamepad2, color: "text-green-500 bg-green-50 group-hover:bg-green-100" },
    { name: "Health", nameAr: "الصحة", icon: HeartPulse, color: "text-purple-500 bg-purple-50 group-hover:bg-purple-100" },
    { name: "Beds", nameAr: "الفراش", icon: BedDouble, color: "text-amber-500 bg-amber-50 group-hover:bg-amber-100" },
  ];

  return (
    <section className="py-12 md:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        <ScrollReveal>
          <div className="text-center mb-8 md:mb-16">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-paws-orange mb-2 md:mb-3">
              Browse Our Collection
            </p>
            <h2 className="text-2xl md:text-5xl font-extrabold tracking-tight text-neutral-900">
              {t("categories_title")}
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-4">
          {categories.map((cat, i) => (
            <ScrollReveal key={cat.name} delay={i * 80}>
              <Link
                href={`/${locale}/shop?category=${cat.name.toLowerCase()}`}
                className="bg-white border border-neutral-100 rounded-2xl p-4 sm:p-6 text-center transition-all duration-300 cursor-pointer group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 active:scale-[0.98] block"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-all ${cat.color}`}>
                  <cat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-neutral-700 group-hover:text-paws-orange transition-colors">
                  {locale === "ar" ? cat.nameAr : cat.name}
                </p>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================
   FEATURED PRODUCTS — Clean cards, no emojis
   ================================================ */
function FeaturedProducts() {
  const t = useTranslations("home");
  const locale = useLocale();

  const products = [
    { id: "1", name: "Royal Canin Maxi Adult 15kg", nameAr: "رويال كانين ماكسي بالغ 15 كيلو", price: 5000, brand: "Royal Canin", image: "https://petsegypt.com/web/image/product.product/3352/image_1920", badge: "Best Seller", badgeColor: "bg-paws-orange" },
    { id: "5", name: "Bravecto Chewable For Large Dogs", nameAr: "برافيكتو أقراص للكلاب الكبيرة", price: 2335, brand: "Bravecto", image: "https://petsegypt.com/web/image/product.product/9135/image_1920", badge: "Sale", badgeColor: "bg-red-500" },
    { id: "2", name: "Bewi Cat Delicaties Rich in Chicken", nameAr: "بيوي كات ديليكاتيز غني بالدجاج", price: 5200, brand: "Bewi Cat", image: "https://petsegypt.com/web/image/product.product/10058/image_1920", badge: "Premium", badgeColor: "bg-emerald-500" },
    { id: "8", name: "2-in-1 Auto Feeder with Fountain", nameAr: "وعاء طعام آلي 2 في 1 مع نافورة مياه", price: 1250, brand: "Generic", image: "https://petsegypt.com/web/image/product.product/11893/image_1920", badge: "Popular", badgeColor: "bg-blue-500" },
  ];

  return (
    <section className="py-12 md:py-24 bg-neutral-50/50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        <ScrollReveal>
          <div className="flex items-end justify-between mb-8 md:mb-14">
            <div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-paws-orange mb-2 md:mb-3">
                Handpicked for Your Pet
              </p>
              <h2 className="text-2xl md:text-5xl font-extrabold tracking-tight text-neutral-900">
                {t("featured_title")}
              </h2>
            </div>
            <Link href={`/${locale}/shop`}>
              <Button variant="ghost" className="text-neutral-500 hover:text-paws-orange gap-1 font-semibold text-sm">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {products.map((product, i) => (
            <ScrollReveal key={product.id} delay={i * 100}>
              <Link
                href={`/${locale}/shop/${product.id}`}
                className="bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-300 group hover:-translate-y-1 block"
              >
                <div className="bg-neutral-50 aspect-square flex items-center justify-center relative overflow-hidden">
                  <Image
                    src={product.image}
                    alt={locale === "ar" ? product.nameAr : product.name}
                    width={400}
                    height={400}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.badge && (
                    <span className={`absolute top-3 left-3 ${product.badgeColor} text-white text-xs px-3 py-1 rounded-full font-bold`}>
                      {product.badge}
                    </span>
                  )}
                </div>
                <div className="p-3 sm:p-5">
                  <p className="text-[10px] sm:text-xs text-neutral-400 font-medium mb-0.5 sm:mb-1">{product.brand}</p>
                  <h3 className="font-bold text-neutral-800 group-hover:text-paws-orange transition-colors text-xs sm:text-base line-clamp-2">
                    {locale === "ar" ? product.nameAr : product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2 sm:mt-3">
                    <p className="text-paws-orange font-extrabold text-sm sm:text-lg">
                      {product.price.toLocaleString()} <span className="text-[10px] sm:text-xs font-normal text-neutral-400">EGP</span>
                    </p>
                    <div className="hidden sm:flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================
   CTA BANNER — White bg with accent card
   ================================================ */
function CTABanner() {
  const t = useTranslations("home");
  const locale = useLocale();

  return (
    <section className="py-12 md:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        <ScrollReveal>
          <div className="relative bg-neutral-900 rounded-2xl sm:rounded-[2rem] p-6 sm:p-10 md:p-16 text-white overflow-hidden">
            {/* Decorative mascot image — combined Cairo & Luna */}
            <div className="absolute bottom-0 -right-8 sm:right-0 md:right-8 w-48 h-32 sm:w-64 sm:h-40 md:w-96 md:h-56 opacity-20 sm:opacity-30 md:opacity-40 pointer-events-none">
              <Image
                src="/mascots/cairo-luna.jpeg"
                alt=""
                width={1376}
                height={768}
                className="w-full h-full object-contain object-bottom"
              />
            </div>

            <div className="relative z-10 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-paws-orange mb-4">
                Join Our Family
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                {t("about_text")}
              </h2>
              <p className="text-white/60 text-sm sm:text-lg mb-6 sm:mb-10 max-w-[50ch]">
                Join 2,000+ happy pet parents in Cairo who trust PAWS Egypt for their pets&apos; needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={`/${locale}/shop`}>
                  <Button
                    size="lg"
                    className="bg-paws-orange hover:bg-paws-orange/90 text-white font-bold px-8 shadow-[0_8px_30px_rgba(244,124,44,0.3)] transition-all hover:scale-[1.02]"
                  >
                    Start Shopping <ArrowRight className="w-5 h-5 ms-2" />
                  </Button>
                </Link>
                <Link href={`/${locale}/blog`}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/20 text-white hover:bg-white/10 font-bold px-8"
                  >
                    Read Our Blog
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ================================================
   HOME PAGE
   ================================================ */
export default function HomePage() {
  const t = useTranslations("home");
  const locale = useLocale();

  return (
    <div className="bg-white">
        {/* 1. Text hero with mascot images */}
        <TextHero
          locale={locale}
          title={t("hero_title")}
          subtitle={t("hero_subtitle")}
          tagline="Cairo's #1 Pet Lifestyle Brand"
          ctaText={t("hero_cta")}
        />

        {/* 2. Cairo — scroll-driven image sequence */}
        <ScrollImageHero
          framesPath="/mascots/cairo-frames"
          frameCount={96}
          name="Cairo"
          subtitle="The Explorer"
          description="Our playful golden pup who loves discovering the best products for your furry friends. Loyal, energetic, and always ready for an adventure."
          textPosition="left"
          accentColor="text-paws-orange"
        />

        {/* 3. Luna — scroll-driven video (transparent background) */}
        <ScrollVideoHero
          src="/mascots/luna.mp4"
          name="Luna"
          subtitle="The Wise One"
          description="Our elegant tabby who knows everything about pet care. Smart, calm, and she picks only the finest quality for your companion."
          textPosition="right"
          accentColor="text-emerald-500"
        />

        <TrustBar />
        <CategoriesSection />
        <FeaturedProducts />
        <CTABanner />
    </div>
  );
}
