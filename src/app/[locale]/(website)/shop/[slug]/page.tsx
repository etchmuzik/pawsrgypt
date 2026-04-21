import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Star, Truck, Shield, Heart, Package } from "lucide-react";
import { ScrollReveal } from "@/components/website/ScrollReveal";
import { AddToCartButton } from "@/components/website/AddToCartButton";
import { createClient } from "@/lib/supabase/server";
import { sanitizeProductHtml, stripHtml } from "@/lib/html";

type ProductDetail = {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  brand: string | null;
  images: string[];
  is_featured: boolean;
  categories: { name_en: string; name_ar: string } | null;
  product_variants: { id: string; price: number; size: string | null; weight: number | null }[];
};

const FALLBACK_PRODUCTS = [
  { id: "1", name_en: "Royal Canin Maxi Adult 15kg", name_ar: "رويال كانين ماكسي بالغ 15 كيلو", price: 5000, brand: "Royal Canin", image: "https://petsegypt.com/web/image/product.product/3352/image_1920", category_en: "Dog Dry Food", category_ar: "طعام كلاب جاف", description_en: "Complete and balanced nutrition for large breed adult dogs. Supports joint health and optimal weight with high-quality proteins.", description_ar: "تغذية كاملة ومتوازنة للكلاب البالغة من السلالات الكبيرة. يدعم صحة المفاصل والوزن المثالي ببروتينات عالية الجودة." },
  { id: "2", name_en: "Bewi Cat Delicaties Rich in Chicken", name_ar: "بيوي كات ديليكاتيز غني بالدجاج", price: 5200, brand: "Bewi Cat", image: "https://petsegypt.com/web/image/product.product/10058/image_1920", category_en: "Cat Dry Food", category_ar: "طعام قطط جاف", description_en: "Premium cat food rich in chicken. Irresistible taste with premium quality ingredients for discerning cats.", description_ar: "طعام قطط متميز غني بالدجاج. طعم لا يقاوم بمكونات عالية الجودة للقطط المميزة." },
  { id: "3", name_en: "OZZO Premium Dog Food with Chicken 15kg", name_ar: "أوزو طعام كلاب بالدجاج 15 كيلو", price: 1800, brand: "OZZO", image: "https://petsegypt.com/web/image/product.product/9201/image_1920", category_en: "Dog Dry Food", category_ar: "طعام كلاب جاف", description_en: "Made with fresh chicken for superior taste. High premium formula with essential vitamins and minerals for adult dogs.", description_ar: "مصنوع من الدجاج الطازج لمذاق فائق. تركيبة عالية الجودة مع فيتامينات ومعادن أساسية للكلاب البالغة." },
  { id: "4", name_en: "Royal Canin Indoor 27 Cat Food 400g", name_ar: "رويال كانين إندور 27 طعام قطط 400 جرام", price: 450, brand: "Royal Canin", image: "https://petsegypt.com/web/image/product.product/11178/image_1920", category_en: "Cat Dry Food", category_ar: "طعام قطط جاف", description_en: "Specially formulated for indoor cats. Helps reduce stool odour and maintains ideal weight with controlled calories.", description_ar: "مصمم خصيصاً للقطط المنزلية. يساعد في تقليل رائحة البراز والحفاظ على الوزن المثالي مع سعرات حرارية محسوبة." },
  { id: "5", name_en: "Bravecto Chewable For Large Dogs 20-40kg", name_ar: "برافيكتو أقراص للكلاب الكبيرة 20-40 كيلو", price: 2335, brand: "Bravecto", image: "https://petsegypt.com/web/image/product.product/9135/image_1920", category_en: "Dog Pharmacy", category_ar: "صيدلية كلاب", description_en: "Long-lasting flea and tick protection. One chewable tablet provides up to 12 weeks of protection for large dogs.", description_ar: "حماية طويلة المدى من البراغيث والقراد. قرص واحد يوفر حماية تصل إلى 12 أسبوعاً للكلاب الكبيرة." },
  { id: "6", name_en: "Sanicat Clumping White Duo 10L", name_ar: "سانيكات كلامبينغ وايت 10 لتر", price: 425, brand: "Sanicat", image: "https://petsegypt.com/web/image/product.product/9862/image_1920", category_en: "Cat Litter", category_ar: "رمل قطط", description_en: "Premium clumping cat litter with vanilla and mandarin scent. Superior odour control and easy cleanup.", description_ar: "رمل قطط متكتل ممتاز برائحة الفانيلا والماندرين. تحكم فائق في الرائحة وتنظيف سهل." },
  { id: "7", name_en: "Vita Day Active Dog Food 20kg", name_ar: "فيتا داي طعام كلاب نشطة 20 كيلو", price: 2900, brand: "Vita Day", image: "https://petsegypt.com/web/image/product.product/6377/image_1920", category_en: "Dog Dry Food", category_ar: "طعام كلاب جاف", description_en: "High energy formula for active dogs. Balanced nutrition to fuel daily activities and maintain muscle mass.", description_ar: "تركيبة عالية الطاقة للكلاب النشطة. تغذية متوازنة لتعزيز الأنشطة اليومية والحفاظ على كتلة العضلات." },
  { id: "8", name_en: "2-in-1 Auto Feeder with Water Fountain 1.5L", name_ar: "وعاء طعام آلي 2 في 1 مع نافورة مياه", price: 1250, brand: "Generic", image: "https://petsegypt.com/web/image/product.product/11893/image_1920", category_en: "Cat Accessories", category_ar: "إكسسوارات قطط", description_en: "Automatic food and water dispenser. Keeps food fresh and water flowing 24/7 for your pet.", description_ar: "موزع طعام ومياه آلي. يحافظ على الطعام طازجاً والمياه متدفقة على مدار الساعة لحيوانك الأليف." },
  { id: "9", name_en: "ALPHA Adult Dogs Dry Food 20kg", name_ar: "ألفا طعام كلاب بالغة 20 كيلو", price: 1485, brand: "ALPHA", image: "https://petsegypt.com/web/image/product.product/7272/image_1920", category_en: "Dog Dry Food", category_ar: "طعام كلاب جاف", description_en: "Premium quality dry food for adult dogs of all breeds. Rich in protein and essential nutrients.", description_ar: "طعام جاف عالي الجودة للكلاب البالغة من جميع السلالات. غني بالبروتين والعناصر الغذائية الأساسية." },
  { id: "10", name_en: "Purina Cat Chow Adult Salmon 1.5kg", name_ar: "بيورينا كات تشاو سلمون 1.5 كيلو", price: 575, brand: "Purina", image: "https://petsegypt.com/web/image/product.product/9156/image_1920", category_en: "Cat Dry Food", category_ar: "طعام قطط جاف", description_en: "Balanced nutrition with real salmon. Supports healthy digestion and strong immunity for adult cats.", description_ar: "تغذية متوازنة مع السلمون الحقيقي. يدعم الهضم الصحي والمناعة القوية للقطط البالغة." },
  { id: "11", name_en: "Cat's Way Clumping Baby Powder 10L", name_ar: "كاتس واي رمل بودرة أطفال 10 لتر", price: 260, brand: "Cat's Way", image: "https://petsegypt.com/web/image/product.product/11374/image_1920", category_en: "Cat Litter", category_ar: "رمل قطط", description_en: "Baby powder scented clumping litter. Excellent absorption and easy cleanup for everyday use.", description_ar: "رمل متكتل برائحة بودرة الأطفال. امتصاص ممتاز وتنظيف سهل للاستخدام اليومي." },
  { id: "12", name_en: "Cat House Multi-Level Cat Tree Tower", name_ar: "برج قطط متعدد المستويات", price: 2950, brand: "Cat House", image: "https://petsegypt.com/web/image/product.product/11790/image_1920", category_en: "Cat Accessories", category_ar: "إكسسوارات قطط", description_en: "Multi-level cat tree with scratching posts, platforms, and cozy hideaway. Perfect for active cats.", description_ar: "برج قطط متعدد المستويات مع أعمدة خدش ومنصات ومخبأ مريح. مثالي للقطط النشطة." },
];

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
    .select("id, name_en, name_ar, description_en, description_ar, brand, images, is_featured, categories(name_en, name_ar), product_variants(id, price, size, weight)")
    .eq("id", slug)
    .eq("is_active", true)
    .single();

  const product = dbProduct as ProductDetail | null;

  // Fallback to static data
  const fallback = !product ? FALLBACK_PRODUCTS.find((p) => p.id === slug) : null;

  if (!product && !fallback) {
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
  const name = product
    ? (locale === "ar" ? product.name_ar : product.name_en)
    : (locale === "ar" ? fallback!.name_ar : fallback!.name_en);
  const description = product
    ? (locale === "ar" ? product.description_ar : product.description_en)
    : (locale === "ar" ? fallback!.description_ar : fallback!.description_en);
  const brand = product?.brand ?? fallback?.brand ?? null;
  const price = product?.product_variants?.[0]?.price ?? fallback?.price ?? 0;
  const imageUrl = product?.images?.[0] ?? fallback?.image ?? null;
  const categoryName = product
    ? (locale === "ar" ? product.categories?.name_ar : product.categories?.name_en)
    : (locale === "ar" ? fallback?.category_ar : fallback?.category_en);
  const productId = product?.id ?? fallback!.id;
  const nameEn = product?.name_en ?? fallback!.name_en;
  const nameAr = product?.name_ar ?? fallback!.name_ar;

  // Related products from fallback
  const relatedProducts = FALLBACK_PRODUCTS.filter((p) => p.id !== slug).slice(0, 4);

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
            <div className="bg-neutral-50 rounded-3xl overflow-hidden border border-neutral-100">
              <div className="aspect-square flex items-center justify-center p-8">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={name}
                    width={600}
                    height={600}
                    className="w-full h-full object-contain"
                    priority
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-neutral-100 flex items-center justify-center">
                    <Package className="w-10 h-10 text-neutral-300" />
                  </div>
                )}
              </div>
            </div>
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

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-neutral-900">
                  {price.toLocaleString()}
                </span>
                <span className="text-lg text-neutral-400 font-medium">
                  {tc("egp")}
                </span>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 text-emerald-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-sm font-medium">{t("in_stock")}</span>
              </div>

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

              {/* Add to Cart */}
              <div className="flex gap-3 pt-4">
                <AddToCartButton
                  id={productId}
                  name={nameEn}
                  nameAr={nameAr}
                  price={price}
                  image={imageUrl ?? ""}
                  size="lg"
                  className="flex-1"
                />
              </div>
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
              {relatedProducts.map((related, index) => (
                <ScrollReveal key={related.id} delay={index * 80}>
                  <Link
                    href={`/${locale}/shop/${related.id}`}
                    className="bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 group block"
                  >
                    <div className="bg-neutral-50 aspect-square flex items-center justify-center overflow-hidden">
                      <Image
                        src={related.image}
                        alt={locale === "ar" ? related.name_ar : related.name_en}
                        width={300}
                        height={300}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-neutral-400 font-medium mb-0.5">{related.brand}</p>
                      <h3 className="text-sm font-bold text-neutral-800 leading-tight group-hover:text-paws-orange transition-colors line-clamp-2">
                        {locale === "ar" ? related.name_ar : related.name_en}
                      </h3>
                      <div className="mt-2">
                        <span className="text-paws-orange font-extrabold">
                          {related.price.toLocaleString()} <span className="text-xs font-normal text-neutral-400">EGP</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
