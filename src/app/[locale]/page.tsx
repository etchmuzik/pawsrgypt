import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Navbar } from "@/components/website/Navbar";
import { Footer } from "@/components/website/Footer";
import { ScrollReveal } from "@/components/website/ScrollReveal";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Star,
  Truck,
  Shield,
  Heart,
  Sparkles,
  Clock,
  Award,
  Phone,
} from "lucide-react";

/* ================================================
   HERO — Gradient background with mascots & CTAs
   ================================================ */
function HeroSection() {
  const t = useTranslations("home");
  const locale = useLocale();

  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Multi-layered gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-paws-orange via-paws-orange-light to-amber-400" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

      {/* Animated floating paw prints */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-white/10 select-none animate-float-slow"
            style={{
              left: `${(i * 19 + 5) % 100}%`,
              top: `${(i * 13 + 3) % 90}%`,
              fontSize: `${20 + (i % 4) * 12}px`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${3 + (i % 3)}s`,
            }}
          >
            🐾
          </div>
        ))}
      </div>

      {/* Decorative circles */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-white/5 rounded-full blur-xl" />
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-white/5 rounded-full blur-xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Text content */}
        <div className="text-white">
          <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 text-sm font-medium mb-6 animate-fade-in-up">
            <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
            <span>Cairo&apos;s #1 Pet Lifestyle Brand</span>
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 animate-slide-in-left">
            {t("hero_title")}
          </h1>

          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-lg animate-slide-in-left stagger-2" style={{ animationDelay: "0.2s" }}>
            {t("hero_subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up stagger-3" style={{ animationDelay: "0.4s" }}>
            <Link href={`/${locale}/shop`}>
              <Button
                size="lg"
                className="bg-white text-paws-orange hover:bg-paws-cream font-bold px-8 shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-pulse-glow"
              >
                {t("hero_cta")}
                <ArrowRight className="w-5 h-5 ms-2" />
              </Button>
            </Link>
            <Link href={`/${locale}/grooming`}>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/20 font-bold px-8 transition-all hover:scale-105"
              >
                {t("hero_cta_secondary")}
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-6 mt-10 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            <div className="flex -space-x-2">
              {["😊", "😄", "🥰", "😍"].map((emoji, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-sm"
                >
                  {emoji}
                </div>
              ))}
            </div>
            <div className="text-sm text-white/90">
              <span className="font-bold text-white">2,000+</span> happy pet parents
            </div>
          </div>
        </div>

        {/* Hero mascots */}
        <div className="hidden lg:flex justify-center items-end relative">
          {/* Glow ring */}
          <div className="absolute w-80 h-80 bg-white/10 rounded-full blur-2xl animate-pulse" />

          {/* Cairo - the dog */}
          <div className="relative z-10 animate-float">
            <div className="w-52 h-52 bg-white/15 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20">
              <span className="text-[100px] select-none">🐶</span>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-1 text-white text-sm font-bold whitespace-nowrap">
              Cairo 🧡
            </div>
          </div>

          {/* Luna - the cat */}
          <div className="relative z-10 -ms-8 mb-4 animate-float-delay">
            <div className="w-44 h-44 bg-white/15 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20">
              <span className="text-[80px] select-none">🐱</span>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-1 text-white text-sm font-bold whitespace-nowrap">
              Luna 💚
            </div>
          </div>

          {/* Floating decorations */}
          <div className="absolute top-4 right-8 text-3xl animate-wiggle">🦴</div>
          <div className="absolute top-16 left-4 text-2xl animate-float-slow" style={{ animationDelay: "1s" }}>🎾</div>
          <div className="absolute bottom-20 right-4 text-2xl animate-wiggle" style={{ animationDelay: "0.5s" }}>🐟</div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 40L48 36C96 32 192 24 288 28C384 32 480 48 576 52C672 56 768 48 864 40C960 32 1056 24 1152 28C1248 32 1344 48 1392 56L1440 64V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0V40Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}

/* ================================================
   TRUST BAR — Animated feature icons
   ================================================ */
function TrustBar() {
  const features = [
    { icon: Truck, text: "Free Cairo Delivery", color: "text-blue-500" },
    { icon: Shield, text: "Premium Quality", color: "text-green-500" },
    { icon: Heart, text: "Pet-First Care", color: "text-red-400" },
    { icon: Star, text: "5-Star Grooming", color: "text-yellow-500" },
  ];

  return (
    <section className="bg-white py-8 -mt-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, text, color }, i) => (
            <ScrollReveal key={text} delay={i * 100}>
              <div className="flex items-center justify-center gap-3 group cursor-default">
                <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-paws-brown-dark">
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
   CATEGORIES — Animated grid cards
   ================================================ */
function CategoriesSection() {
  const t = useTranslations("home");
  const locale = useLocale();

  const categories = [
    { name: "Food & Treats", nameAr: "أطعمة ومكافآت", emoji: "🍖", gradient: "from-orange-100 to-orange-50", hover: "hover:from-orange-200 hover:to-orange-100" },
    { name: "Accessories", nameAr: "إكسسوارات", emoji: "🎀", gradient: "from-pink-100 to-pink-50", hover: "hover:from-pink-200 hover:to-pink-100" },
    { name: "Grooming", nameAr: "العناية", emoji: "✂️", gradient: "from-sky-100 to-sky-50", hover: "hover:from-sky-200 hover:to-sky-100" },
    { name: "Toys", nameAr: "ألعاب", emoji: "🎾", gradient: "from-green-100 to-green-50", hover: "hover:from-green-200 hover:to-green-100" },
    { name: "Health", nameAr: "الصحة", emoji: "💊", gradient: "from-purple-100 to-purple-50", hover: "hover:from-purple-200 hover:to-purple-100" },
    { name: "Beds", nameAr: "الفراش", emoji: "🛏️", gradient: "from-amber-100 to-amber-50", hover: "hover:from-amber-200 hover:to-amber-100" },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="text-paws-orange font-semibold text-sm uppercase tracking-wider">Browse Our Collection</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-paws-brown-dark mt-2">
              {t("categories_title")}
            </h2>
            <div className="w-16 h-1 bg-paws-orange rounded-full mx-auto mt-4" />
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
          {categories.map((cat, i) => (
            <ScrollReveal key={cat.name} delay={i * 80}>
              <Link
                href={`/${locale}/shop?category=${cat.name.toLowerCase()}`}
                className={`bg-gradient-to-br ${cat.gradient} ${cat.hover} rounded-2xl p-6 text-center transition-all duration-300 cursor-pointer group hover:shadow-lg hover:-translate-y-1 block`}
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform group-hover:animate-wiggle">
                  {cat.emoji}
                </div>
                <p className="text-sm font-bold text-paws-brown-dark group-hover:text-paws-orange transition-colors">
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
   MASCOT INTRO — Meet Cairo & Luna
   ================================================ */
function MascotIntro() {
  return (
    <section className="py-20 bg-gradient-to-br from-paws-cream to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-10 left-10 text-6xl opacity-10 animate-float-slow">🐾</div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-10 animate-float" style={{ animationDelay: "1s" }}>🐾</div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="text-paws-orange font-semibold text-sm uppercase tracking-wider">Our Mascots</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-paws-brown-dark mt-2">
              Meet Cairo & Luna
            </h2>
            <div className="w-16 h-1 bg-paws-orange rounded-full mx-auto mt-4" />
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Cairo */}
          <ScrollReveal delay={100}>
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 group text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-paws-orange to-paws-orange-light" />
              <div className="w-32 h-32 mx-auto bg-orange-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-7xl animate-float">🐶</span>
              </div>
              <h3 className="text-2xl font-extrabold text-paws-brown-dark mb-2">Cairo</h3>
              <p className="text-paws-orange font-semibold text-sm mb-3">Loyal & Energetic</p>
              <p className="text-paws-brown text-sm leading-relaxed">
                Our playful golden pup who loves exploring Cairo&apos;s pet shops! He&apos;s always excited to help you find the best products for your furry friends.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-paws-brown/60">
                <span className="bg-orange-50 px-3 py-1 rounded-full">🦴 Treats lover</span>
                <span className="bg-orange-50 px-3 py-1 rounded-full">🎾 Playful</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Luna */}
          <ScrollReveal delay={250}>
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 group text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-300" />
              <div className="w-32 h-32 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-7xl animate-float-delay">🐱</span>
              </div>
              <h3 className="text-2xl font-extrabold text-paws-brown-dark mb-2">Luna</h3>
              <p className="text-emerald-500 font-semibold text-sm mb-3">Smart & Calm</p>
              <p className="text-paws-brown text-sm leading-relaxed">
                Our wise tabby who knows everything about pet care! She guides you through grooming tips and picks only the finest quality products.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-paws-brown/60">
                <span className="bg-emerald-50 px-3 py-1 rounded-full">📚 Smart</span>
                <span className="bg-emerald-50 px-3 py-1 rounded-full">✨ Elegant</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/* ================================================
   FEATURED PRODUCTS — Card grid with hover effects
   ================================================ */
function FeaturedProducts() {
  const t = useTranslations("home");
  const locale = useLocale();

  const products = [
    { id: "1", name: "Premium Dog Food", nameAr: "طعام كلاب فاخر", price: 250, emoji: "🐕", badge: "Best Seller", badgeColor: "bg-paws-orange" },
    { id: "2", name: "Cat Grooming Kit", nameAr: "طقم تجميل للقطط", price: 180, emoji: "🐱", badge: "New", badgeColor: "bg-emerald-500" },
    { id: "3", name: "Pet Collar Leather", nameAr: "طوق جلد للحيوانات", price: 120, emoji: "🎀", badge: null, badgeColor: "" },
    { id: "4", name: "Interactive Toy Set", nameAr: "مجموعة ألعاب تفاعلية", price: 95, emoji: "🎾", badge: "Sale", badgeColor: "bg-red-500" },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-12">
            <div>
              <span className="text-paws-orange font-semibold text-sm uppercase tracking-wider">Handpicked for Your Pet</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-paws-brown-dark mt-2">
                {t("featured_title")}
              </h2>
            </div>
            <Link href={`/${locale}/shop`}>
              <Button variant="ghost" className="text-paws-orange hover:text-paws-orange/80 gap-1 font-bold">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, i) => (
            <ScrollReveal key={product.id} delay={i * 100}>
              <Link
                href={`/${locale}/shop/${product.id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-2 block"
              >
                <div className="bg-gradient-to-br from-paws-sand/20 to-paws-cream/30 h-52 flex items-center justify-center relative overflow-hidden">
                  <span className="text-7xl group-hover:scale-125 transition-transform duration-500">
                    {product.emoji}
                  </span>
                  {product.badge && (
                    <span className={`absolute top-3 left-3 ${product.badgeColor} text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm`}>
                      {product.badge}
                    </span>
                  )}
                  {/* Quick action overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-white/90 backdrop-blur-sm text-paws-orange text-xs font-bold px-4 py-2 rounded-full shadow-sm">
                      View Details →
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-paws-brown-dark group-hover:text-paws-orange transition-colors text-base">
                    {locale === "ar" ? product.nameAr : product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-paws-orange font-extrabold text-lg">
                      {product.price} <span className="text-xs font-normal text-paws-brown/60">EGP</span>
                    </p>
                    <div className="flex gap-0.5">
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
   WHY PAWS — Value propositions with icons
   ================================================ */
function WhyPaws() {
  const t = useTranslations("home");
  const locale = useLocale();

  const values = [
    {
      icon: Award,
      title: "Premium Quality",
      titleAr: "جودة فائقة",
      desc: "Only the finest products sourced from trusted brands worldwide.",
      descAr: "فقط أجود المنتجات من أفضل العلامات التجارية العالمية.",
      color: "bg-orange-50 text-paws-orange",
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      titleAr: "توصيل سريع",
      desc: "Same-day delivery across Cairo. Your pet shouldn't wait!",
      descAr: "توصيل في نفس اليوم في جميع أنحاء القاهرة.",
      color: "bg-blue-50 text-blue-500",
    },
    {
      icon: Sparkles,
      title: "Expert Grooming",
      titleAr: "عناية متخصصة",
      desc: "Professional grooming services by certified pet care specialists.",
      descAr: "خدمات عناية احترافية من متخصصين معتمدين.",
      color: "bg-purple-50 text-purple-500",
    },
    {
      icon: Clock,
      title: "24/7 Support",
      titleAr: "دعم على مدار الساعة",
      desc: "Our pet care team is always ready to help with advice.",
      descAr: "فريق رعاية الحيوانات الأليفة لدينا جاهز دائمًا للمساعدة.",
      color: "bg-green-50 text-green-500",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-14">
            <span className="text-paws-orange font-semibold text-sm uppercase tracking-wider">Why Choose Us</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-paws-brown-dark mt-2">
              {t("about_title")}
            </h2>
            <div className="w-16 h-1 bg-paws-orange rounded-full mx-auto mt-4" />
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <ScrollReveal key={v.title} delay={i * 100}>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-paws-orange/30 hover:shadow-lg transition-all duration-300 group text-center">
                <div className={`w-14 h-14 ${v.color} rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform`}>
                  <v.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-paws-brown-dark text-lg mb-2">
                  {locale === "ar" ? v.titleAr : v.title}
                </h3>
                <p className="text-sm text-paws-brown/70 leading-relaxed">
                  {locale === "ar" ? v.descAr : v.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================
   CTA BANNER — Call to action with mascots
   ================================================ */
function CTABanner() {
  const t = useTranslations("home");
  const locale = useLocale();

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="relative bg-gradient-to-br from-paws-orange via-paws-orange-light to-amber-400 rounded-3xl p-8 md:p-14 text-white overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-6 right-8 text-6xl opacity-20 animate-float">🐶</div>
            <div className="absolute bottom-6 right-24 text-5xl opacity-20 animate-float-delay">🐱</div>
            <div className="absolute top-1/2 right-16 text-3xl opacity-10 animate-wiggle">🐾</div>

            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
                {t("about_text")}
              </h2>
              <p className="text-white/90 text-lg mb-8">
                Join 2,000+ happy pet parents in Cairo who trust PAWS Egypt for their pets&apos; needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={`/${locale}/shop`}>
                  <Button
                    size="lg"
                    className="bg-white text-paws-orange hover:bg-paws-cream font-bold px-8 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    Start Shopping <ArrowRight className="w-5 h-5 ms-2" />
                  </Button>
                </Link>
                <Link href={`/${locale}/grooming`}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/20 font-bold px-8"
                  >
                    <Phone className="w-4 h-4 me-2" />
                    Book Grooming
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
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <TrustBar />
        <CategoriesSection />
        <MascotIntro />
        <FeaturedProducts />
        <WhyPaws />
        <CTABanner />
      </main>
      <Footer />
    </>
  );
}
