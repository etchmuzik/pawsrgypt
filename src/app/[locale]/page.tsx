import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Navbar } from "@/components/website/Navbar";
import { Footer } from "@/components/website/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Truck, Shield, Heart } from "lucide-react";

function HeroSection() {
  const t = useTranslations("home");
  const locale = useLocale();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-paws-orange to-paws-orange-light min-h-[85vh] flex items-center">
      {/* Background paw pattern */}
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-white text-4xl select-none"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 13 + 7) % 100}%`,
              transform: `rotate(${i * 37}deg)`,
            }}
          >
            🐾
          </div>
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Star className="w-4 h-4 fill-current" />
            Cairo&apos;s #1 Pet Store
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            {t("hero_title")}
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-lg">
            {t("hero_subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href={`/${locale}/shop`}>
              <Button
                size="lg"
                className="bg-white text-paws-orange hover:bg-paws-cream font-semibold px-8"
              >
                {t("hero_cta")}
                <ArrowRight className="w-4 h-4 ms-2" />
              </Button>
            </Link>
            <Link href={`/${locale}/grooming`}>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/20 font-semibold px-8"
              >
                {t("hero_cta_secondary")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero visual */}
        <div className="hidden lg:flex justify-center">
          <div className="w-80 h-80 bg-white/20 rounded-full flex items-center justify-center">
            <div className="text-[120px]">🐶</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const features = [
    { icon: Truck, text: "Fast Cairo Delivery" },
    { icon: Shield, text: "Premium Quality" },
    { icon: Heart, text: "Pet-First Care" },
    { icon: Star, text: "5-Star Grooming" },
  ];

  return (
    <section className="bg-paws-cream border-y border-paws-sand">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center justify-center gap-2 text-paws-brown"
            >
              <Icon className="w-5 h-5 text-paws-orange" />
              <span className="text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoriesSection() {
  const t = useTranslations("home");
  const locale = useLocale();

  const categories = [
    { name: "Food & Treats", nameAr: "أطعمة ومكافآت", emoji: "🍖", bg: "bg-orange-50" },
    { name: "Accessories", nameAr: "إكسسوارات", emoji: "🎀", bg: "bg-pink-50" },
    { name: "Grooming", nameAr: "العناية", emoji: "✂️", bg: "bg-blue-50" },
    { name: "Toys", nameAr: "ألعاب", emoji: "🎾", bg: "bg-green-50" },
    { name: "Health", nameAr: "الصحة", emoji: "💊", bg: "bg-purple-50" },
    { name: "Beds", nameAr: "الفراش", emoji: "🛏️", bg: "bg-yellow-50" },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-paws-brown-dark text-center mb-10">
          {t("categories_title")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/${locale}/shop?category=${cat.name.toLowerCase()}`}
              className={`${cat.bg} rounded-2xl p-4 text-center hover:scale-105 transition-transform cursor-pointer group`}
            >
              <div className="text-4xl mb-2">{cat.emoji}</div>
              <p className="text-sm font-medium text-paws-brown-dark group-hover:text-paws-orange transition-colors">
                {locale === "ar" ? cat.nameAr : cat.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedProducts() {
  const t = useTranslations("home");
  const locale = useLocale();

  // Placeholder products — replaced with Supabase data once connected
  const products = [
    { id: "1", name: "Premium Dog Food", nameAr: "طعام كلاب فاخر", price: 250, emoji: "🐕", badge: "Best Seller" },
    { id: "2", name: "Cat Grooming Kit", nameAr: "طقم تجميل للقطط", price: 180, emoji: "🐱", badge: "New" },
    { id: "3", name: "Pet Collar Leather", nameAr: "طوق جلد للحيوانات", price: 120, emoji: "🎀", badge: null },
    { id: "4", name: "Interactive Toy Set", nameAr: "مجموعة ألعاب تفاعلية", price: 95, emoji: "🎾", badge: "Sale" },
  ];

  return (
    <section className="py-16 bg-paws-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-paws-brown-dark">
            {t("featured_title")}
          </h2>
          <Link href={`/${locale}/shop`}>
            <Button variant="ghost" className="text-paws-orange hover:text-paws-orange/80 gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/${locale}/shop/${product.id}`}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="bg-paws-sand/30 h-48 flex items-center justify-center text-6xl">
                {product.emoji}
              </div>
              <div className="p-4">
                {product.badge && (
                  <span className="inline-block bg-paws-orange text-white text-xs px-2 py-0.5 rounded-full mb-2">
                    {product.badge}
                  </span>
                )}
                <h3 className="font-semibold text-paws-brown-dark group-hover:text-paws-orange transition-colors">
                  {locale === "ar" ? product.nameAr : product.name}
                </h3>
                <p className="text-paws-orange font-bold mt-1">
                  {product.price} EGP
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutTeaser() {
  const t = useTranslations("home");
  const locale = useLocale();

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-paws-orange to-paws-orange-light rounded-3xl p-8 md:p-12 text-white text-center">
          <div className="text-5xl mb-4">🐾</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("about_title")}</h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8 text-lg">
            {t("about_text")}
          </p>
          <Link href={`/${locale}/about`}>
            <Button
              size="lg"
              className="bg-white text-paws-orange hover:bg-paws-cream font-semibold"
            >
              {t("about_cta")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <TrustBar />
        <CategoriesSection />
        <FeaturedProducts />
        <AboutTeaser />
      </main>
      <Footer />
    </>
  );
}
