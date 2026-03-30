import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Star } from "lucide-react";
import { ScrollReveal } from "@/components/website/ScrollReveal";

type ProductRow = {
  id: string;
  name_en: string;
  name_ar: string;
  sku: string;
  brand: string | null;
  is_featured: boolean;
  images: string[];
  categories: { name_en: string; name_ar: string } | null;
  product_variants: { price: number }[];
};

const FALLBACK_PRODUCTS = [
  { id: "1", name_en: "Premium Dry Dog Food 3kg", name_ar: "طعام كلاب جاف 3 كيلو", price: 250, emoji: "🍖", badge: "Best Seller" },
  { id: "2", name_en: "Royal Canin Cat Food 2kg", name_ar: "طعام رويال كانين للقطط 2 كيلو", price: 320, emoji: "🐱", badge: null },
  { id: "3", name_en: "Dog Grooming Kit", name_ar: "طقم تجميل الكلاب", price: 180, emoji: "✂️", badge: "New" },
  { id: "4", name_en: "Leather Pet Collar", name_ar: "طوق جلدي للحيوانات", price: 120, emoji: "🎀", badge: null },
  { id: "5", name_en: "Interactive Ball Toy", name_ar: "كرة لعب تفاعلية", price: 75, emoji: "🎾", badge: "Sale" },
  { id: "6", name_en: "Orthopedic Pet Bed", name_ar: "سرير حيوانات مريح", price: 450, emoji: "🛏️", badge: null },
  { id: "7", name_en: "Vitamin Supplements", name_ar: "مكملات غذائية", price: 95, emoji: "💊", badge: null },
  { id: "8", name_en: "Stainless Steel Bowl Set", name_ar: "طقم أطباق ستانلس ستيل", price: 85, emoji: "🥣", badge: null },
];

const CATEGORIES = [
  { id: "all", label: "All", labelAr: "الكل" },
  { id: "food", label: "Food & Treats", labelAr: "أطعمة" },
  { id: "accessories", label: "Accessories", labelAr: "إكسسوارات" },
  { id: "grooming", label: "Grooming", labelAr: "العناية" },
  { id: "toys", label: "Toys", labelAr: "ألعاب" },
  { id: "health", label: "Health", labelAr: "الصحة" },
  { id: "beds", label: "Beds", labelAr: "الفراش" },
];

const EMOJI_MAP: Record<string, string> = {
  "food & treats": "🍖",
  accessories: "🎀",
  grooming: "✂️",
  toys: "🎾",
  "health & wellness": "💊",
  "beds & furniture": "🛏️",
};

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: dbProducts } = await supabase
    .from("products")
    .select("id, name_en, name_ar, sku, brand, is_featured, images, categories(name_en, name_ar), product_variants(price)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  const products = dbProducts as ProductRow[] | null;
  const hasDbProducts = products && products.length > 0;

  return <ShopContent products={hasDbProducts ? products : null} />;
}

function ShopContent({ products }: { products: ProductRow[] | null }) {
  const t = useTranslations("shop");
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-paws-orange to-paws-orange-light text-white py-14">
        <div className="absolute inset-0 opacity-10">
          {["🍖", "🎀", "🎾", "✂️", "💊", "🛏️"].map((e, i) => (
            <span key={i} className="absolute text-3xl select-none" style={{ left: `${i * 18 + 5}%`, top: `${(i * 20 + 10) % 80}%` }}>{e}</span>
          ))}
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{t("title")}</h1>
          <p className="text-white/80 text-lg">Find everything your pet needs</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search + Filter bar */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t("search_placeholder")}
              className="ps-9 bg-white border-gray-200"
            />
          </div>
          <Button variant="outline" className="border-gray-200 gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            {t("filter")}
          </Button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className="px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 bg-white hover:bg-paws-orange hover:text-white hover:border-paws-orange transition-all duration-200"
            >
              {locale === "ar" ? cat.labelAr : cat.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products ? (
            products.map((product, i) => {
              const price = product.product_variants?.[0]?.price ?? 0;
              const catName = product.categories?.name_en?.toLowerCase() ?? "";
              const emoji = EMOJI_MAP[catName] ?? "🐾";

              return (
                <ScrollReveal key={product.id} delay={i * 50}>
                  <Link
                    href={`/${locale}/shop/${product.id}`}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group block"
                  >
                    <div className="bg-gradient-to-br from-paws-sand/10 to-paws-cream/20 h-48 flex items-center justify-center text-6xl relative">
                      {emoji}
                      {product.is_featured && (
                        <span className="absolute top-3 left-3 bg-paws-orange text-white text-xs px-3 py-1 rounded-full font-bold">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-paws-brown-dark leading-tight group-hover:text-paws-orange transition-colors line-clamp-2">
                        {locale === "ar" ? product.name_ar : product.name_en}
                      </h3>
                      {product.brand && (
                        <p className="text-xs text-gray-400 mt-1">{product.brand}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-paws-orange font-extrabold">
                          {price} <span className="text-xs font-normal text-gray-400">EGP</span>
                        </span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })
          ) : (
            FALLBACK_PRODUCTS.map((product, i) => (
              <ScrollReveal key={product.id} delay={i * 50}>
                <Link
                  href={`/${locale}/shop/${product.id}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group block"
                >
                  <div className="bg-gradient-to-br from-paws-sand/10 to-paws-cream/20 h-48 flex items-center justify-center text-6xl relative">
                    {product.emoji}
                    {product.badge && (
                      <span className="absolute top-3 left-3 bg-paws-orange text-white text-xs px-3 py-1 rounded-full font-bold">
                        {product.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-paws-brown-dark leading-tight group-hover:text-paws-orange transition-colors line-clamp-2">
                      {locale === "ar" ? product.name_ar : product.name_en}
                    </h3>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-paws-orange font-extrabold">
                        {product.price} <span className="text-xs font-normal text-gray-400">EGP</span>
                      </span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
