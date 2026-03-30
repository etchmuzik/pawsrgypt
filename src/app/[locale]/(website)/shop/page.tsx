import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";

// Placeholder products — replace with Supabase query once DB is connected
const PLACEHOLDER_PRODUCTS = [
  { id: "1", name: "Premium Dry Dog Food 3kg", nameAr: "طعام كلاب جاف 3 كيلو", price: 250, category: "food", emoji: "🍖", badge: "Best Seller" },
  { id: "2", name: "Royal Canin Cat Food 2kg", nameAr: "طعام رويال كانين للقطط 2 كيلو", price: 320, category: "food", emoji: "🐱", badge: null },
  { id: "3", name: "Dog Grooming Kit", nameAr: "طقم تجميل الكلاب", price: 180, category: "grooming", emoji: "✂️", badge: "New" },
  { id: "4", name: "Leather Pet Collar", nameAr: "طوق جلدي للحيوانات", price: 120, category: "accessories", emoji: "🎀", badge: null },
  { id: "5", name: "Interactive Ball Toy", nameAr: "كرة لعب تفاعلية", price: 75, category: "toys", emoji: "🎾", badge: "Sale" },
  { id: "6", name: "Orthopedic Pet Bed", nameAr: "سرير حيوانات مريح", price: 450, category: "beds", emoji: "🛏️", badge: null },
  { id: "7", name: "Vitamin Supplements", nameAr: "مكملات غذائية", price: 95, category: "health", emoji: "💊", badge: null },
  { id: "8", name: "Stainless Steel Bowl Set", nameAr: "طقم أطباق ستانلس ستيل", price: 85, category: "accessories", emoji: "🥣", badge: null },
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

export default function ShopPage() {
  const t = useTranslations("shop");
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-paws-cream/30">
      {/* Header */}
      <div className="bg-paws-orange text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search + Filter bar */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("search_placeholder")}
              className="ps-9 bg-white border-paws-sand"
            />
          </div>
          <Button variant="outline" className="border-paws-sand gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            {t("filter")}
          </Button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className="px-4 py-1.5 rounded-full text-sm font-medium border border-paws-sand bg-white hover:bg-paws-orange hover:text-white hover:border-paws-orange transition-colors"
            >
              {locale === "ar" ? cat.labelAr : cat.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {PLACEHOLDER_PRODUCTS.map((product) => (
            <Link
              key={product.id}
              href={`/${locale}/shop/${product.id}`}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group"
            >
              <div className="bg-paws-sand/20 h-44 flex items-center justify-center text-5xl">
                {product.emoji}
              </div>
              <div className="p-3">
                {product.badge && (
                  <span className="inline-block bg-paws-orange text-white text-xs px-2 py-0.5 rounded-full mb-1.5">
                    {product.badge}
                  </span>
                )}
                <h3 className="text-sm font-semibold text-paws-brown-dark leading-tight group-hover:text-paws-orange transition-colors line-clamp-2">
                  {locale === "ar" ? product.nameAr : product.name}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-paws-orange font-bold text-sm">
                    {product.price} {t("..common.egp", { fallback: "EGP" })}
                  </span>
                  <button className="text-xs bg-paws-orange/10 text-paws-orange px-2 py-1 rounded-full hover:bg-paws-orange hover:text-white transition-colors">
                    +
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
