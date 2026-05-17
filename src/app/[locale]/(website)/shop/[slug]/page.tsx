import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Star, Truck, Shield, Heart, Package } from "lucide-react";
import { ScrollReveal } from "@/components/website/ScrollReveal";
import { AddToCartButton } from "@/components/website/AddToCartButton";
import { NotifyWhenAvailable } from "@/components/website/NotifyWhenAvailable";
import { ProductImageZoom } from "@/components/website/ProductImageZoom";
import { VariantPickerAndCart, type VariantOption } from "@/components/website/VariantPickerAndCart";
import { createClient } from "@/lib/supabase/server";
import { sanitizeProductHtml, stripHtml } from "@/lib/html";

type ProductDetail = {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  brand: string | null;
  category_id: string | null;
  images: string[];
  is_featured: boolean;
  categories: { name_en: string; name_ar: string } | null;
  product_variants: {
    id: string;
    price: number;
    size: string | null;
    weight: number | null;
    color: string | null;
    is_active: boolean;
  }[];
  stock: { quantity: number; variant_id: string | null }[];
};

type RelatedRow = {
  id: string;
  name_en: string;
  name_ar: string;
  brand: string | null;
  images: string[];
  product_variants: { price: number }[];
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("product");
  const tc = await getTranslations("common");
  const locale = await getLocale();

  // Try Supabase first
  const supabase = await createClient();
  const { data: dbProduct } = await supabase
    .from("products")
    .select(
      "id, name_en, name_ar, description_en, description_ar, brand, category_id, images, is_featured, categories(name_en, name_ar), product_variants(id, price, size, weight, color, is_active), stock(quantity, variant_id)",
    )
    .eq("id", slug)
    .eq("is_active", true)
    .single();

  const product = dbProduct as ProductDetail | null;

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-6">
            <Package className="w-8 h-8 text-neutral-300" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">
            {t("not_found")}
          </h1>
          <p className="text-neutral-500 mb-6 max-w-md mx-auto">
            {t("not_found_desc")}
          </p>
          <Link
            href={`/${locale}/shop`}
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-full hover:bg-neutral-800 transition-colors font-medium"
          >
            {locale === "ar" ? (
              <>
                {t("back_to_shop")}
                <ArrowLeft className="w-4 h-4" />
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4" />
                {t("back_to_shop")}
              </>
            )}
          </Link>
        </div>
      </div>
    );
  }

  // Normalize data
  const name = locale === "ar" ? product.name_ar : product.name_en;
  const description = locale === "ar" ? product.description_ar : product.description_en;
  const brand = product.brand;
  const imageUrl = product.images?.[0] ?? null;
  const categoryName = locale === "ar" ? product.categories?.name_ar : product.categories?.name_en;
  const productId = product.id;
  const nameEn = product.name_en;
  const nameAr = product.name_ar;

  // Build per-variant stock + options for the picker.
  // Stock: sum quantities per variant_id; rows with variant_id=null fall back
  // to the product-level total (legacy single-variant model).
  const activeVariants = (product?.product_variants ?? []).filter((v) => v.is_active);
  const stockByVariant = new Map<string | null, number>();
  for (const s of product?.stock ?? []) {
    const key = s.variant_id ?? null;
    stockByVariant.set(key, (stockByVariant.get(key) ?? 0) + (Number(s.quantity) || 0));
  }
  const legacyStock = stockByVariant.get(null) ?? 0;

  const variantOptions: VariantOption[] = activeVariants.map((v) => ({
    id: v.id,
    size: v.size,
    weight: v.weight,
    color: v.color,
    price: v.price,
    // If we have per-variant stock rows, use them. Otherwise distribute the
    // legacy product-level stock across variants (treat as in stock if >0).
    quantity:
      stockByVariant.get(v.id) ?? (activeVariants.length === 1 ? legacyStock : Infinity),
  }));

  // For the simple single-variant render path:
  const price = variantOptions[0]?.price ?? 0;
  const totalStock = variantOptions.reduce(
    (sum, v) => sum + (v.quantity === Infinity ? 1 : v.quantity),
    0
  );
  const outOfStock = totalStock <= 0;
  const showPicker = variantOptions.length > 1;

  // Related products: same brand first (most relevant), then top up from the
  // same category if we have fewer than 4. Empty array if neither yields hits.
  const relatedProducts: RelatedRow[] = [];
  if (product.brand) {
    const { data: brandRelated } = await supabase
      .from("products")
      .select("id, name_en, name_ar, brand, images, product_variants(price)")
      .eq("is_active", true)
      .eq("brand", product.brand)
      .neq("id", product.id)
      .limit(4);
    relatedProducts.push(...((brandRelated as RelatedRow[] | null) ?? []));
  }
  if (relatedProducts.length < 4 && product.category_id) {
    const need = 4 - relatedProducts.length;
    const seen = new Set([product.id, ...relatedProducts.map((r) => r.id)]);
    const { data: categoryRelated } = await supabase
      .from("products")
      .select("id, name_en, name_ar, brand, images, product_variants(price)")
      .eq("is_active", true)
      .eq("category_id", product.category_id)
      .neq("id", product.id)
      .limit(need + relatedProducts.length); // overfetch to filter dupes
    for (const r of (categoryRelated as RelatedRow[] | null) ?? []) {
      if (relatedProducts.length >= 4) break;
      if (seen.has(r.id)) continue;
      relatedProducts.push(r);
      seen.add(r.id);
    }
  }

  const BackArrow = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-neutral-100">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-3">
          <Link
            href={`/${locale}/shop`}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-paws-orange transition-colors"
          >
            <BackArrow className="w-4 h-4" />
            {t("back_to_shop")}
          </Link>
        </div>
      </div>

      {/* Product Detail */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          {/* Product Image */}
          <ScrollReveal>
            {imageUrl ? (
              <ProductImageZoom src={imageUrl} alt={name} />
            ) : (
              <div className="bg-neutral-50 rounded-3xl overflow-hidden border border-neutral-100">
                <div className="aspect-square flex items-center justify-center p-8">
                  <div className="w-24 h-24 rounded-2xl bg-neutral-100 flex items-center justify-center">
                    <Package className="w-10 h-10 text-neutral-300" />
                  </div>
                </div>
              </div>
            )}
          </ScrollReveal>

          {/* Product Info */}
          <ScrollReveal delay={100}>
            <div className="flex flex-col gap-5">
              {/* Brand */}
              {brand && (
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-paws-orange">
                  {brand}
                </p>
              )}

              {/* Name */}
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 leading-tight">
                {name}
              </h1>

              {/* Category */}
              {categoryName && (
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Package className="w-4 h-4" />
                  <span>{categoryName}</span>
                </div>
              )}

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-neutral-400">(4.8)</span>
              </div>

              {/* Price + stock (only when no variant picker; picker owns these) */}
              {!showPicker && (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-neutral-900">
                      {price.toLocaleString()}
                    </span>
                    <span className="text-lg text-neutral-400 font-medium">
                      {tc("egp")}
                    </span>
                  </div>

                  {outOfStock ? (
                    <div className="flex items-center gap-2 text-red-600">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span className="text-sm font-medium">{t("out_of_stock")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span className="text-sm font-medium">{t("in_stock")}</span>
                    </div>
                  )}
                </>
              )}

              {/* Description */}
              {description && stripHtml(description) && (
                <div className="pt-2">
                  <div
                    className="prose prose-neutral max-w-none text-neutral-500 leading-relaxed prose-headings:text-neutral-800 prose-a:text-paws-orange prose-strong:text-neutral-700"
                    dir={locale === "ar" ? "rtl" : "ltr"}
                    dangerouslySetInnerHTML={{ __html: sanitizeProductHtml(description) }}
                  />
                </div>
              )}

              {/* Features */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="flex flex-col items-center gap-2 bg-neutral-50 rounded-xl p-4 text-center">
                  <Truck className="w-5 h-5 text-paws-orange" />
                  <span className="text-xs font-medium text-neutral-600">
                    {locale === "ar" ? "توصيل سريع" : "Fast Delivery"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 bg-neutral-50 rounded-xl p-4 text-center">
                  <Shield className="w-5 h-5 text-paws-orange" />
                  <span className="text-xs font-medium text-neutral-600">
                    {locale === "ar" ? "أصلي 100%" : "100% Genuine"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 bg-neutral-50 rounded-xl p-4 text-center">
                  <Heart className="w-5 h-5 text-paws-orange" />
                  <span className="text-xs font-medium text-neutral-600">
                    {locale === "ar" ? "جودة مضمونة" : "Quality First"}
                  </span>
                </div>
              </div>

              {/* Add to Cart / Notify */}
              {showPicker ? (
                <VariantPickerAndCart
                  productId={productId}
                  nameEn={nameEn}
                  nameAr={nameAr}
                  imageUrl={imageUrl ?? ""}
                  variants={variantOptions}
                />
              ) : (
                <div className="flex gap-3 pt-4">
                  {outOfStock ? (
                    <NotifyWhenAvailable
                      productId={productId}
                      variantId={variantOptions[0]?.id ?? null}
                      size="lg"
                      className="flex-1"
                    />
                  ) : (
                    <AddToCartButton
                      id={productId}
                      name={nameEn}
                      nameAr={nameAr}
                      price={price}
                      image={imageUrl ?? ""}
                      variantId={variantOptions[0]?.id ?? null}
                      size="lg"
                      className="flex-1"
                    />
                  )}
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-neutral-100">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
            <ScrollReveal>
              <h2 className="text-2xl font-extrabold text-neutral-900 mb-8">
                {t("related_products")}
              </h2>
            </ScrollReveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((related, index) => {
                const relatedName = locale === "ar" ? related.name_ar : related.name_en;
                const relatedImage = related.images?.[0] ?? null;
                const relatedPrice = related.product_variants?.[0]?.price ?? 0;
                return (
                  <ScrollReveal key={related.id} delay={index * 80}>
                    <Link
                      href={`/${locale}/shop/${related.id}`}
                      className="bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 group block"
                    >
                      <div className="bg-neutral-50 aspect-square flex items-center justify-center overflow-hidden">
                        {relatedImage ? (
                          <Image
                            src={relatedImage}
                            alt={relatedName}
                            width={300}
                            height={300}
                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center">
                            <Package className="w-8 h-8 text-neutral-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        {related.brand && (
                          <p className="text-xs text-neutral-400 font-medium mb-0.5">{related.brand}</p>
                        )}
                        <h3 className="text-sm font-bold text-neutral-800 leading-tight group-hover:text-paws-orange transition-colors line-clamp-2">
                          {relatedName}
                        </h3>
                        <div className="mt-2">
                          <span className="text-paws-orange font-extrabold">
                            {relatedPrice.toLocaleString()} <span className="text-xs font-normal text-neutral-400">EGP</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
