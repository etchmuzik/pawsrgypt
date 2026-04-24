"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Star, X } from "lucide-react";
import { ScrollReveal } from "@/components/website/ScrollReveal";

export type ProductRow = {
  id: string;
  name_en: string;
  name_ar: string;
  sku: string;
  brand: string | null;
  is_featured: boolean;
  images: string[];
  categories: { name_en: string; name_ar: string } | null;
  product_variants: { price: number }[];
  stock?: { quantity: number }[];
};

function totalStock(p: ProductRow): number {
  if (!p.stock || p.stock.length === 0) return Infinity; // unknown = treat as in stock
  return p.stock.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
}

export const FALLBACK_PRODUCTS = [
  { id: "1", name_en: "Royal Canin Maxi Adult 15kg", name_ar: "رويال كانين ماكسي بالغ 15 كيلو", price: 5000, brand: "Royal Canin", image: "https://petsegypt.com/web/image/product.product/3352/image_1920", badge: "Best Seller", category: "Dog Dry Food" },
  { id: "2", name_en: "Bewi Cat Delicaties Rich in Chicken", name_ar: "بيوي كات ديليكاتيز غني بالدجاج", price: 5200, brand: "Bewi Cat", image: "https://petsegypt.com/web/image/product.product/10058/image_1920", badge: "Premium", category: "Cat Dry Food" },
  { id: "3", name_en: "OZZO Premium Dog Food with Chicken 15kg", name_ar: "أوزو طعام كلاب بالدجاج 15 كيلو", price: 1800, brand: "OZZO", image: "https://petsegypt.com/web/image/product.product/9201/image_1920", badge: "New", category: "Dog Dry Food" },
  { id: "4", name_en: "Royal Canin Indoor 27 Cat Food 400g", name_ar: "رويال كانين إندور 27 طعام قطط 400 جرام", price: 450, brand: "Royal Canin", image: "https://petsegypt.com/web/image/product.product/11178/image_1920", badge: null, category: "Cat Dry Food" },
  { id: "5", name_en: "Bravecto Chewable For Large Dogs 20-40kg", name_ar: "برافيكتو أقراص للكلاب الكبيرة 20-40 كيلو", price: 2335, brand: "Bravecto", image: "https://petsegypt.com/web/image/product.product/9135/image_1920", badge: "Sale", category: "Dog Pharmacy" },
  { id: "6", name_en: "Sanicat Clumping White Duo 10L", name_ar: "سانيكات كلامبينغ وايت 10 لتر", price: 425, brand: "Sanicat", image: "https://petsegypt.com/web/image/product.product/9862/image_1920", badge: null, category: "Cat Litter" },
  { id: "7", name_en: "Vita Day Active Dog Food 20kg", name_ar: "فيتا داي طعام كلاب نشطة 20 كيلو", price: 2900, brand: "Vita Day", image: "https://petsegypt.com/web/image/product.product/6377/image_1920", badge: null, category: "Dog Dry Food" },
  { id: "8", name_en: "2-in-1 Auto Feeder with Water Fountain 1.5L", name_ar: "وعاء طعام آلي 2 في 1 مع نافورة مياه", price: 1250, brand: "Generic", image: "https://petsegypt.com/web/image/product.product/11893/image_1920", badge: "Popular", category: "Cat Accessories" },
  { id: "9", name_en: "ALPHA Adult Dogs Dry Food 20kg", name_ar: "ألفا طعام كلاب بالغة 20 كيلو", price: 1485, brand: "ALPHA", image: "https://petsegypt.com/web/image/product.product/7272/image_1920", badge: null, category: "Dog Dry Food" },
  { id: "10", name_en: "Purina Cat Chow Adult Salmon 1.5kg", name_ar: "بيورينا كات تشاو سلمون 1.5 كيلو", price: 575, brand: "Purina", image: "https://petsegypt.com/web/image/product.product/9156/image_1920", badge: null, category: "Cat Dry Food" },
  { id: "11", name_en: "Cat's Way Clumping Baby Powder 10L", name_ar: "كاتس واي رمل بودرة أطفال 10 لتر", price: 260, brand: "Cat's Way", image: "https://petsegypt.com/web/image/product.product/11374/image_1920", badge: null, category: "Cat Litter" },
  { id: "12", name_en: "Cat House Multi-Level Cat Tree Tower", name_ar: "برج قطط متعدد المستويات", price: 2950, brand: "Cat House", image: "https://petsegypt.com/web/image/product.product/11790/image_1920", badge: "Popular", category: "Cat Accessories" },
];

const CATEGORIES = [
  { id: "all", label: "All", labelAr: "الكل" },
  { id: "dog-food", label: "Dog Food", labelAr: "طعام كلاب" },
  { id: "cat-food", label: "Cat Food", labelAr: "طعام قطط" },
  { id: "cat-litter", label: "Cat Litter", labelAr: "رمل قطط" },
  { id: "accessories", label: "Accessories", labelAr: "إكسسوارات" },
  { id: "pharmacy", label: "Pharmacy", labelAr: "صيدلية" },
];

export function ShopContent({ products }: { products: ProductRow[] | null }) {
  const t = useTranslations("shop");
  const locale = useLocale();

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    if (!products) return null;

    const categoryToken = activeCategory === "all" ? null : activeCategory;

    return products.filter((p) => {
      if (normalizedQuery) {
        const haystack = [
          p.name_en,
          p.name_ar,
          p.brand ?? "",
          p.sku,
          p.categories?.name_en ?? "",
          p.categories?.name_ar ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }

      if (categoryToken) {
        const cat = (p.categories?.name_en ?? "").toLowerCase();
        const tokens = categoryToken.toLowerCase().split("-");
        // Simple category token match — e.g. "dog-food" matches "Food & Treats" + "dog" tag.
        // For now, keep it lenient: any token appears in the category name.
        const matches = tokens.some((t) => cat.includes(t));
        if (!matches) return false;
      }

      return true;
    });
  }, [products, normalizedQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 md:py-16">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-paws-orange mb-2 sm:mb-3">
            PAWS Egypt
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-neutral-900 mb-2 sm:mb-3">
            {t("title")}
          </h1>
          <p className="text-sm sm:text-lg text-neutral-500 max-w-[50ch]">
            Premium pet food, accessories, and supplies delivered across Cairo
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8">
        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search_placeholder")}
              className="ps-9 pe-9 h-11 bg-white border-neutral-200 focus:border-paws-orange focus:ring-paws-orange/20"
              type="search"
              inputMode="search"
              autoComplete="off"
              aria-label={t("search_placeholder")}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-neutral-100 transition-colors"
                aria-label="Clear search"
                type="button"
              >
                <X className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            )}
          </div>
          <Button variant="outline" className="border-neutral-200 gap-2 text-neutral-600 hover:text-paws-orange hover:border-paws-orange h-11 sm:w-auto">
            <SlidersHorizontal className="w-4 h-4" />
            {t("filter")}
          </Button>
        </div>

        {/* Categories — horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 sm:flex-wrap sm:overflow-visible sm:pb-0 sm:mb-10 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border active:scale-[0.97] transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-900 hover:text-white hover:border-neutral-900"
                }`}
              >
                {locale === "ar" ? cat.labelAr : cat.label}
              </button>
            );
          })}
        </div>

        {/* Result count + clear filter */}
        {(query || activeCategory !== "all") && filteredProducts && (
          <div className="flex items-center justify-between mb-4 text-sm text-neutral-500">
            <span>
              {locale === "ar"
                ? `${filteredProducts.length} نتيجة`
                : `${filteredProducts.length} result${filteredProducts.length === 1 ? "" : "s"}`}
            </span>
            <button
              onClick={() => {
                setQuery("");
                setActiveCategory("all");
              }}
              className="text-paws-orange font-semibold hover:underline"
            >
              {locale === "ar" ? "مسح الفلتر" : "Clear filters"}
            </button>
          </div>
        )}

        {/* Empty state */}
        {products && filteredProducts && filteredProducts.length === 0 && (
          <div className="text-center py-16 sm:py-24">
            <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-neutral-300" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">
              {locale === "ar" ? "لا توجد منتجات" : "No products found"}
            </h3>
            <p className="text-sm text-neutral-500">
              {locale === "ar"
                ? "جرب بحثاً مختلفاً أو امسح الفلتر"
                : "Try a different search or clear the filters"}
            </p>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
          {products ? (
            (filteredProducts ?? []).map((product, i) => {
              const price = product.product_variants?.[0]?.price ?? 0;
              const imageUrl = product.images?.[0] ?? null;
              const stock = totalStock(product);
              const outOfStock = stock <= 0;

              return (
                <ScrollReveal key={product.id} delay={i * 50}>
                  <Link
                    href={`/${locale}/shop/${product.id}`}
                    className="bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 group block"
                  >
                    <div className="bg-neutral-50 aspect-square flex items-center justify-center relative overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={locale === "ar" ? product.name_ar : product.name_en}
                          width={400}
                          height={400}
                          className={`w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 ${outOfStock ? "opacity-50 grayscale" : ""}`}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center">
                          <span className="text-2xl text-neutral-300">P</span>
                        </div>
                      )}
                      {product.is_featured && !outOfStock && (
                        <span className="absolute top-3 left-3 bg-paws-orange text-white text-xs px-3 py-1 rounded-full font-bold">
                          Featured
                        </span>
                      )}
                      {outOfStock && (
                        <span className="absolute top-3 left-3 bg-neutral-900 text-white text-xs px-3 py-1 rounded-full font-bold">
                          {locale === "ar" ? "نفد المخزون" : "Out of Stock"}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      {product.brand && (
                        <p className="text-xs text-neutral-400 font-medium mb-1">{product.brand}</p>
                      )}
                      <h3 className="text-sm font-bold text-neutral-800 leading-tight group-hover:text-paws-orange transition-colors line-clamp-2">
                        {locale === "ar" ? product.name_ar : product.name_en}
                      </h3>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-paws-orange font-extrabold text-lg">
                          {price.toLocaleString()} <span className="text-xs font-normal text-neutral-400">EGP</span>
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
                  className="bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 group block"
                >
                  <div className="bg-neutral-50 aspect-square flex items-center justify-center relative overflow-hidden">
                    <Image
                      src={product.image}
                      alt={locale === "ar" ? product.name_ar : product.name_en}
                      width={400}
                      height={400}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.badge && (
                      <span className="absolute top-3 left-3 bg-paws-orange text-white text-xs px-3 py-1 rounded-full font-bold">
                        {product.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-neutral-400 font-medium mb-1">{product.brand}</p>
                    <h3 className="text-sm font-bold text-neutral-800 leading-tight group-hover:text-paws-orange transition-colors line-clamp-2">
                      {locale === "ar" ? product.name_ar : product.name_en}
                    </h3>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-paws-orange font-extrabold text-lg">
                        {product.price.toLocaleString()} <span className="text-xs font-normal text-neutral-400">EGP</span>
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
