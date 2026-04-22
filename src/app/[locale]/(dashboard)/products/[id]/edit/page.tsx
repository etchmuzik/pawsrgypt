"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/dashboard/ImageUploader";
import { RichTextEditor } from "@/components/dashboard/RichTextEditor";
import { ArrowLeft, Loader2, Barcode } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Product, ProductVariant } from "@/lib/supabase/types";

interface CategoryOption {
  id: string;
  name_en: string;
  name_ar: string;
}

function generateBarcode(): string {
  const prefix = "628";
  const digits = Array.from({ length: 9 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  const raw = prefix + digits;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(raw[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return raw + checkDigit;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const isAr = locale === "ar";
  const L = {
    back: isAr ? "رجوع" : "Back",
    title: isAr ? "تعديل المنتج" : "Edit Product",
    basicInfo: isAr ? "البيانات الأساسية" : "Basic Information",
    sku: isAr ? "كود المنتج" : "SKU",
    brand: isAr ? "البراند" : "Brand",
    brandPh: isAr ? "مثلا: Royal Canin" : "e.g. Royal Canin",
    nameEn: isAr ? "الاسم (إنجليزي)" : "Name (English)",
    nameAr: isAr ? "الاسم (عربي)" : "Name (Arabic)",
    nameEnPh: isAr ? "اسم المنتج بالإنجليزي" : "Product name in English",
    nameArPh: "اسم المنتج بالعربي",
    descEn: isAr ? "الوصف (إنجليزي)" : "Description (English)",
    descAr: isAr ? "الوصف (عربي)" : "Description (Arabic)",
    descEnPh: isAr ? "وصف المنتج بالإنجليزي" : "Product description in English",
    descArPh: "وصف المنتج بالعربي",
    images: isAr ? "صور المنتج" : "Product Images",
    imagesNote: isAr ? "ارفع 10 صور كحد أقصى. أول صورة هتكون الرئيسية." : "Upload up to 10 images. The first image will be the main product image.",
    classification: isAr ? "التصنيف" : "Classification",
    category: isAr ? "الفئة" : "Category",
    selectCategory: isAr ? "اختار فئة" : "Select category",
    unitType: isAr ? "وحدة القياس" : "Unit Type",
    u_piece: isAr ? "قطعة" : "Piece",
    u_kg: isAr ? "كيلو (kg)" : "Kilogram (kg)",
    u_g: isAr ? "جرام (g)" : "Gram (g)",
    u_l: isAr ? "لتر (L)" : "Liter (L)",
    u_ml: isAr ? "ميلليلتر (mL)" : "Milliliter (mL)",
    u_pack: isAr ? "باك" : "Pack",
    u_box: isAr ? "علبة" : "Box",
    barcode: isAr ? "الباركود" : "Barcode",
    barcodePh: isAr ? "ادخل أو ولد باركود" : "Enter or generate barcode",
    generate: isAr ? "ولد" : "Generate",
    pricing: isAr ? "التسعير" : "Pricing",
    sellingPrice: isAr ? "سعر البيع" : "Selling Price",
    costPrice: isAr ? "سعر التكلفة" : "Cost Price",
    egp: isAr ? "ج.م" : "EGP",
    tagsCs: isAr ? "وسوم (مفصولة بفاصلة)" : "Tags (comma-separated)",
    statusVis: isAr ? "الحالة والظهور" : "Status & Visibility",
    activeStatus: isAr ? "حالة التفعيل" : "Active Status",
    activeNote: isAr ? "المنتج يظهر لما يكون مفعل" : "Product will be visible when active",
    featured: isAr ? "منتج مميز" : "Featured",
    featuredNote: isAr ? "يظهر المنتج في قسم المميزات في الموقع" : "Show this product in featured sections on the website",
    cancel: isAr ? "إلغاء" : "Cancel",
    save: isAr ? "حفظ التغييرات" : "Save Changes",
    saving: isAr ? "بيتحفظ..." : "Saving...",
    notFound: isAr ? "المنتج مش موجود" : "Product not found",
    updateFailed: isAr ? "فشل تحديث المنتج" : "Failed to update product",
  };

  const productId = params.id as string;

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    sku: "",
    name_en: "",
    name_ar: "",
    description_en: "",
    description_ar: "",
    category_id: "",
    brand: "",
    unit_type: "piece",
    barcode: "",
    price: "",
    cost_price: "",
    is_active: true,
    is_featured: false,
    images: [] as string[],
    tags: "",
  });

  useEffect(() => {
    async function loadData() {
      const categoriesRes = await supabase
        .from("categories")
        .select("id, name_en, name_ar")
        .eq("is_active", true)
        .order("sort_order");

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      const { data: variantData } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .limit(1)
        .single();

      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }

      if (productError || !productData) {
        toast.error(L.notFound);
        router.push(`/${locale}/products`);
        return;
      }

      const product = productData as Product;
      const variant = variantData as ProductVariant | null;

      setForm({
        sku: product.sku ?? "",
        name_en: product.name_en ?? "",
        name_ar: product.name_ar ?? "",
        description_en: product.description_en ?? "",
        description_ar: product.description_ar ?? "",
        category_id: product.category_id ?? "",
        brand: product.brand ?? "",
        unit_type: product.unit_type ?? "piece",
        barcode: product.barcode ?? "",
        price: variant?.price?.toString() ?? "",
        cost_price: variant?.cost_price?.toString() ?? "",
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
        images: product.images ?? [],
        tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
      });

      setFetching(false);
    }

    loadData();
  }, [supabase, productId, locale, router]);

  function updateField(name: string, value: unknown) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleGenerateBarcode() {
    setForm((prev) => ({ ...prev, barcode: generateBarcode() }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.sku.trim() || !form.name_en.trim()) {
      toast.error("SKU and English name are required.");
      return;
    }

    const price = parseFloat(form.price);
    const costPrice = parseFloat(form.cost_price);

    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    if (isNaN(costPrice) || costPrice < 0) {
      toast.error("Please enter a valid cost price.");
      return;
    }

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setLoading(true);

    const { error: productError } = await supabase
      .from("products")
      .update({
        sku: form.sku.trim(),
        name_en: form.name_en.trim(),
        name_ar: form.name_ar.trim(),
        description_en: form.description_en.trim() || null,
        description_ar: form.description_ar.trim() || null,
        category_id: form.category_id || null,
        brand: form.brand.trim() || null,
        unit_type: form.unit_type,
        barcode: form.barcode.trim() || null,
        images: form.images,
        tags,
        is_active: form.is_active,
        is_featured: form.is_featured,
      } as never)
      .eq("id", productId);

    if (productError) {
      setLoading(false);
      toast.error(productError.message ?? L.updateFailed);
      return;
    }

    const { error: variantError } = await supabase
      .from("product_variants")
      .update({
        price,
        cost_price: costPrice,
        barcode: form.barcode.trim() || null,
        is_active: form.is_active,
      } as never)
      .eq("product_id", productId);

    setLoading(false);

    if (variantError) {
      toast.error(
        `${isAr ? "تم تحديث المنتج بس فشل تحديث المتغير" : "Product updated but variant failed"}: ${variantError.message}`
      );
      return;
    }

    toast.success(isAr ? "تم تحديث المنتج بنجاح!" : "Product updated successfully!");
    router.push(`/${locale}/products`);
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-paws-orange" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/products`}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-paws-brown"
          >
            <ArrowLeft className="w-4 h-4" /> {L.back}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-paws-brown-dark">{L.title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <h2 className="font-semibold text-paws-brown-dark text-lg">{L.basicInfo}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sku">{L.sku} *</Label>
              <Input
                id="sku"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="PAW-DOG-001"
                className="bg-white border-paws-sand"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand">{L.brand}</Label>
              <Input
                id="brand"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                placeholder={L.brandPh}
                className="bg-white border-paws-sand"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name_en">{L.nameEn} *</Label>
              <Input
                id="name_en"
                name="name_en"
                value={form.name_en}
                onChange={handleChange}
                placeholder={L.nameEnPh}
                className="bg-white border-paws-sand"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name_ar">{L.nameAr}</Label>
              <Input
                id="name_ar"
                name="name_ar"
                value={form.name_ar}
                onChange={handleChange}
                placeholder={L.nameArPh}
                className="bg-white border-paws-sand"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="description_en">{L.descEn}</Label>
              <RichTextEditor
                value={form.description_en}
                onChange={(html) => updateField("description_en", html)}
                placeholder={L.descEnPh}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description_ar">{L.descAr}</Label>
              <RichTextEditor
                value={form.description_ar}
                onChange={(html) => updateField("description_ar", html)}
                placeholder={L.descArPh}
                dir="rtl"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <h2 className="font-semibold text-paws-brown-dark text-lg">{L.classification}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category_id">{L.category}</Label>
              <select
                id="category_id"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="flex h-9 w-full rounded-lg border border-paws-sand bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">{L.selectCategory}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {locale === "ar" ? cat.name_ar : cat.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unit_type">{L.unitType}</Label>
              <select
                id="unit_type"
                name="unit_type"
                value={form.unit_type}
                onChange={handleChange}
                className="flex h-9 w-full rounded-lg border border-paws-sand bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="piece">{L.u_piece}</option>
                <option value="kg">{L.u_kg}</option>
                <option value="g">{L.u_g}</option>
                <option value="l">{L.u_l}</option>
                <option value="ml">{L.u_ml}</option>
                <option value="pack">{L.u_pack}</option>
                <option value="box">{L.u_box}</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="barcode">{L.barcode}</Label>
            <div className="flex gap-2">
              <Input
                id="barcode"
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                placeholder={L.barcodePh}
                className="bg-white border-paws-sand flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateBarcode}
                className="gap-1.5 border-paws-sand shrink-0"
              >
                <Barcode className="w-4 h-4" /> {L.generate}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <h2 className="font-semibold text-paws-brown-dark text-lg">{L.pricing}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">{L.sellingPrice} ({L.egp}) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
                className="bg-white border-paws-sand"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cost_price">{L.costPrice} ({L.egp}) *</Label>
              <Input
                id="cost_price"
                name="cost_price"
                type="number"
                min="0"
                step="0.01"
                value={form.cost_price}
                onChange={handleChange}
                placeholder="0.00"
                className="bg-white border-paws-sand"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <h2 className="font-semibold text-paws-brown-dark text-lg">{L.images}</h2>

          <ImageUploader
            bucket="product-images"
            folder={productId}
            images={form.images}
            onChange={(urls) => updateField("images", urls)}
          />
        </div>

        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <h2 className="font-semibold text-paws-brown-dark text-lg">{isAr ? "وسوم" : "Tags"}</h2>

          <div className="space-y-1.5">
            <Label htmlFor="tags">{L.tagsCs}</Label>
            <Input
              id="tags"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder={isAr ? "مثلا: كلاب، طعام، راقي" : "e.g. dog, food, premium"}
              className="bg-white border-paws-sand"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{L.activeStatus}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{L.activeNote}</p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked: boolean) =>
                updateField("is_active", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>{L.featured}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{L.featuredNote}</p>
            </div>
            <Switch
              checked={form.is_featured}
              onCheckedChange={(checked: boolean) =>
                updateField("is_featured", checked)
              }
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href={`/${locale}/products`}>
            <Button type="button" variant="outline" className="border-paws-sand">
              {L.cancel}
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-paws-orange hover:bg-paws-orange/90 text-white gap-1.5"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? L.saving : L.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
