import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Package, Star, Truck } from "lucide-react";
import { ScrollReveal } from "@/components/website/ScrollReveal";
import { AddToCartButton } from "@/components/website/AddToCartButton";

// Placeholder products — same data as shop page, replace with Supabase query once DB is connected
const PLACEHOLDER_PRODUCTS = [
  { id: "1", name: "Premium Dry Dog Food 3kg", nameAr: "طعام كلاب جاف 3 كيلو", price: 250, category: "food", emoji: "🍖", badge: "Best Seller", description: "High-quality dry dog food made with real chicken and wholesome grains. Provides complete and balanced nutrition for adult dogs of all breeds.", descriptionAr: "طعام كلاب جاف عالي الجودة مصنوع من دجاج حقيقي وحبوب كاملة. يوفر تغذية كاملة ومتوازنة للكلاب البالغة من جميع السلالات." },
  { id: "2", name: "Royal Canin Cat Food 2kg", nameAr: "طعام رويال كانين للقطط 2 كيلو", price: 320, category: "food", emoji: "🐱", badge: null, description: "Premium cat food formulated to support your cat's health, vitality, and natural beauty. With essential vitamins and minerals.", descriptionAr: "طعام قطط متميز مصمم لدعم صحة قطتك وحيويتها وجمالها الطبيعي. يحتوي على فيتامينات ومعادن أساسية." },
  { id: "3", name: "Dog Grooming Kit", nameAr: "طقم تجميل الكلاب", price: 180, category: "grooming", emoji: "✂️", badge: "New", description: "Complete grooming kit including brush, comb, nail clipper, and shampoo. Everything you need for at-home grooming sessions.", descriptionAr: "طقم تجميل كامل يشمل فرشاة ومشط وقصاصة أظافر وشامبو. كل ما تحتاجه لجلسات العناية في المنزل." },
  { id: "4", name: "Leather Pet Collar", nameAr: "طوق جلدي للحيوانات", price: 120, category: "accessories", emoji: "🎀", badge: null, description: "Handcrafted genuine leather collar with adjustable buckle. Durable and comfortable for daily wear.", descriptionAr: "طوق جلدي أصلي مصنوع يدوياً مع إبزيم قابل للتعديل. متين ومريح للارتداء اليومي." },
  { id: "5", name: "Interactive Ball Toy", nameAr: "كرة لعب تفاعلية", price: 75, category: "toys", emoji: "🎾", badge: "Sale", description: "Durable rubber ball that bounces unpredictably to keep your pet entertained for hours. Non-toxic and safe for chewing.", descriptionAr: "كرة مطاطية متينة ترتد بشكل غير متوقع لتسلية حيوانك الأليف لساعات. غير سامة وآمنة للمضغ." },
  { id: "6", name: "Orthopedic Pet Bed", nameAr: "سرير حيوانات مريح", price: 450, category: "beds", emoji: "🛏️", badge: null, description: "Memory foam pet bed with removable, washable cover. Provides superior joint support for pets of all ages.", descriptionAr: "سرير حيوانات أليفة بفوم ذاكرة مع غطاء قابل للإزالة والغسل. يوفر دعماً فائقاً للمفاصل لجميع الأعمار." },
  { id: "7", name: "Vitamin Supplements", nameAr: "مكملات غذائية", price: 95, category: "health", emoji: "💊", badge: null, description: "Daily multivitamin supplement for dogs and cats. Supports immune system, coat health, and overall vitality.", descriptionAr: "مكمل فيتامينات يومي للكلاب والقطط. يدعم جهاز المناعة وصحة الفراء والحيوية العامة." },
  { id: "8", name: "Stainless Steel Bowl Set", nameAr: "طقم أطباق ستانلس ستيل", price: 85, category: "accessories", emoji: "🥣", badge: null, description: "Set of 2 non-slip stainless steel bowls. Rust-resistant and dishwasher safe. Perfect for food and water.", descriptionAr: "طقم من 2 أطباق ستانلس ستيل غير قابلة للانزلاق. مقاومة للصدأ وآمنة لغسالة الأطباق." },
];

const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  food: { en: "Food & Treats", ar: "أطعمة" },
  accessories: { en: "Accessories", ar: "إكسسوارات" },
  grooming: { en: "Grooming", ar: "العناية" },
  toys: { en: "Toys", ar: "ألعاب" },
  health: { en: "Health", ar: "الصحة" },
  beds: { en: "Beds", ar: "الفراش" },
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = useTranslations("product");
  const tc = useTranslations("common");
  const locale = useLocale();

  const product = PLACEHOLDER_PRODUCTS.find((p) => p.id === slug);

  if (!product) {
    return (
      <div className="min-h-screen bg-paws-cream/30 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-7xl mb-6">🐾</div>
          <h1 className="text-2xl font-bold text-paws-brown-dark mb-3">
            {t("not_found")}
          </h1>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {t("not_found_desc")}
          </p>
          <Link
            href={`/${locale}/shop`}
            className="inline-flex items-center gap-2 bg-paws-orange text-white px-6 py-3 rounded-full hover:bg-paws-orange/90 transition-colors font-medium"
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

  const relatedProducts = PLACEHOLDER_PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  const fillerProducts =
    relatedProducts.length < 4
      ? PLACEHOLDER_PRODUCTS.filter(
          (p) => p.id !== product.id && !relatedProducts.find((r) => r.id === p.id)
        ).slice(0, 4 - relatedProducts.length)
      : [];

  const displayRelated = [...relatedProducts, ...fillerProducts];
  const categoryLabel = CATEGORY_LABELS[product.category];
  const BackArrow = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-paws-cream/30">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-paws-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Link
            href={`/${locale}/shop`}
            className="inline-flex items-center gap-2 text-sm text-paws-brown hover:text-paws-orange transition-colors"
          >
            <BackArrow className="w-4 h-4" />
            {t("back_to_shop")}
          </Link>
        </div>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image Area */}
          <ScrollReveal>
            <div className="bg-white rounded-3xl border border-paws-sand overflow-hidden">
              <div className="bg-paws-sand/20 aspect-square flex items-center justify-center">
                <span className="text-[120px] md:text-[160px]">
                  {product.emoji}
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* Product Info */}
          <ScrollReveal delay={100}>
            <div className="flex flex-col gap-6">
              {/* Badge */}
              {product.badge && (
                <span className="inline-block self-start bg-paws-orange text-white text-xs px-3 py-1 rounded-full font-medium">
                  {product.badge}
                </span>
              )}

              {/* Name */}
              <h1 className="text-2xl md:text-3xl font-bold text-paws-brown-dark leading-tight">
                {locale === "ar" ? product.nameAr : product.name}
              </h1>

              {/* Category */}
              {categoryLabel && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span>
                    {t("category")}:{" "}
                    {locale === "ar" ? categoryLabel.ar : categoryLabel.en}
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-paws-orange">
                  {product.price}
                </span>
                <span className="text-lg text-paws-orange font-medium">
                  {tc("egp")}
                </span>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium">{t("in_stock")}</span>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-lg font-semibold text-paws-brown-dark mb-2">
                  {t("description")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {locale === "ar" ? product.descriptionAr : product.description}
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-white border border-paws-sand rounded-xl p-3 text-sm">
                  <Truck className="w-4 h-4 text-paws-orange" />
                  <span className="text-paws-brown-dark">
                    {locale === "ar" ? "توصيل سريع" : "Fast Delivery"}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white border border-paws-sand rounded-xl p-3 text-sm">
                  <Star className="w-4 h-4 text-paws-orange" />
                  <span className="text-paws-brown-dark">
                    {locale === "ar" ? "جودة مضمونة" : "Quality Guaranteed"}
                  </span>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex gap-3 pt-2">
                <AddToCartButton
                  id={product.id}
                  name={product.name}
                  nameAr={product.nameAr}
                  price={product.price}
                  emoji={product.emoji}
                  size="lg"
                  className="flex-1"
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Related Products */}
      {displayRelated.length > 0 && (
        <div className="bg-white border-t border-paws-sand">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <ScrollReveal>
              <h2 className="text-2xl font-bold text-paws-brown-dark mb-6 text-center">
                {t("related_products")}
              </h2>
            </ScrollReveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {displayRelated.map((related, index) => (
                <ScrollReveal key={related.id} delay={index * 80}>
                  <Link
                    href={`/${locale}/shop/${related.id}`}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group border border-paws-sand"
                  >
                    <div className="bg-paws-sand/20 h-44 flex items-center justify-center text-5xl">
                      {related.emoji}
                    </div>
                    <div className="p-3">
                      {related.badge && (
                        <span className="inline-block bg-paws-orange text-white text-xs px-2 py-0.5 rounded-full mb-1.5">
                          {related.badge}
                        </span>
                      )}
                      <h3 className="text-sm font-semibold text-paws-brown-dark leading-tight group-hover:text-paws-orange transition-colors line-clamp-2">
                        {locale === "ar" ? related.nameAr : related.name}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-paws-orange font-bold text-sm">
                          {related.price} {tc("egp")}
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
