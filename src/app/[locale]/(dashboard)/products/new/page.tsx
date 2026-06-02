"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, Barcode, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ImageUploader } from "@/components/dashboard/ImageUploader";
import { RichTextEditor } from "@/components/dashboard/RichTextEditor";
import { VariantEditor, newVariantRow, type VariantRow } from "@/components/dashboard/VariantEditor";

interface CategoryOption {
  id: string;
  name_en: string;
  name_ar: string;
}

interface ProductForm {
  sku: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  category_id: string;
  brand: string;
  unit_type: string;
  barcode: string;
  is_active: boolean;
  is_featured: boolean;
  images: string[];
  tags: string[];
  warehouse_id: string;
  variants: VariantRow[];
}

interface WarehouseOption {
  id: string;
  name: string;
}

const INITIAL_FORM: ProductForm = {
  sku: "",
  name_en: "",
  name_ar: "",
  description_en: "",
  description_ar: "",
  category_id: "",
  brand: "",
  unit_type: "piece",
  barcode: "",
  is_active: true,
  is_featured: false,
  images: [],
  tags: [],
  warehouse_id: "",
  variants: [newVariantRow()],
};

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

function slugifyPart(value: string, len: number): string {
  const cleaned = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, len);
  return cleaned || "XX";
}

function generateSku(categoryName: string | undefined, brand: string): string {
  const cat = slugifyPart(categoryName ?? "PET", 3);
  const br = slugifyPart(brand || "GEN", 3);
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `${cat}-${br}-${seq}`;
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto p-6">Loading…</div>}>
      <NewProductPageInner />
    </Suspense>
  );
}

function NewProductPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get("duplicate");
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const isAr = locale === "ar";
  const L = {
    back: isAr ? "رجوع" : "Back",
    title: isAr ? "ضيف منتج جديد" : "Add New Product",
    basicInfo: isAr ? "البيانات الأساسية" : "Basic Information",
    auto: isAr ? "تلقائي" : "Auto",
    autoTitle: isAr ? "توليد SKU من الفئة والبراند" : "Generate SKU from category + brand",
    skuPh: isAr ? "مثلا: PAW-DOG-001" : "e.g. PAW-DOG-001",
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
    tags: isAr ? "الوسوم" : "Tags",
    tagsPh: isAr ? "اكتب وسم واضغط Enter..." : "Type a tag and press Enter...",
    tagsNote: isAr ? "اضغط Enter أو فاصلة لإضافة وسم" : "Press Enter or comma to add a tag",
    statusVis: isAr ? "الحالة والظهور" : "Status & Visibility",
    activeStatus: isAr ? "حالة التفعيل" : "Active Status",
    activeNote: isAr ? "المنتج يظهر لما يكون مفعل" : "Product will be visible when active",
    featured: isAr ? "منتج مميز" : "Featured Product",
    featuredNote: isAr ? "يظهر المنتج في قسم المميزات في الموقع" : "Show this product in featured sections on the website",
    cancel: isAr ? "إلغاء" : "Cancel",
    saveDraft: isAr ? "حفظ كمسودة" : "Save as Draft",
    draftSaving: isAr ? "بيتحفظ..." : "Saving...",
    create: isAr ? "إنشاء المنتج" : "Create Product",
    creating: isAr ? "بيتحفظ..." : "Creating...",
    skuNameRequired: isAr ? "الـ SKU والاسم الإنجليزي مطلوبين." : "SKU and English name are required.",
    productFailed: isAr ? "فشل إنشاء المنتج" : "Failed to create product",
    variantFailed: isAr ? "تم إنشاء المنتج بس فشل إنشاء المتغير" : "Product created but variant failed",
    draftSaved: isAr ? "تم حفظ المسودة." : "Draft saved.",
    ok: isAr ? "تم إنشاء المنتج بنجاح!" : "Product created successfully!",
    duplicated: isAr ? "تم تكرار المنتج. الـ SKU والصور اتمسحوا." : "Product duplicated. SKU and images cleared.",
    stockFailed: isAr ? "تم حفظ المنتج بس فشل تسجيل المخزون" : "Product saved but stock failed",
  };

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [form, setForm] = useState<ProductForm>(INITIAL_FORM);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from("categories")
        .select("id, name_en, name_ar")
        .eq("is_active", true)
        .order("sort_order");
      if (data) {
        setCategories(data);
      }
    }
    async function loadWarehouses() {
      const { data } = await supabase
        .from("warehouses")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      const rows = (data as WarehouseOption[] | null) ?? [];
      setWarehouses(rows);
      if (rows.length > 0) {
        setForm((f) => ({ ...f, warehouse_id: f.warehouse_id || rows[0].id }));
      }
    }
    loadCategories();
    loadWarehouses();
  }, [supabase]);

  useEffect(() => {
    if (!duplicateId) return;
    let cancelled = false;
    async function loadDuplicate() {
      const { data: product } = await supabase
        .from("products")
        .select(
          "name_en, name_ar, description_en, description_ar, category_id, brand, unit_type, tags, is_active, is_featured, product_variants(price, cost_price)",
        )
        .eq("id", duplicateId as string)
        .single();
      if (cancelled || !product) return;
      const p = product as {
        name_en: string;
        name_ar: string;
        description_en: string | null;
        description_ar: string | null;
        category_id: string | null;
        brand: string | null;
        unit_type: string | null;
        tags: string[] | null;
        is_active: boolean;
        is_featured: boolean;
        product_variants: { price: number; cost_price: number }[];
      };
      const variant = p.product_variants?.[0];
      setForm({
        sku: "",
        name_en: `${p.name_en} (copy)`,
        name_ar: p.name_ar,
        description_en: p.description_en ?? "",
        description_ar: p.description_ar ?? "",
        category_id: p.category_id ?? "",
        brand: p.brand ?? "",
        unit_type: p.unit_type ?? "piece",
        barcode: "",
        is_active: p.is_active,
        is_featured: false,
        images: [],
        tags: p.tags ?? [],
        warehouse_id: warehouses[0]?.id ?? "",
        variants:
          variant != null
            ? [
                {
                  ...newVariantRow(),
                  price: variant.price != null ? String(variant.price) : "",
                  cost_price: variant.cost_price != null ? String(variant.cost_price) : "",
                },
              ]
            : [newVariantRow()],
      });
      toast.info(L.duplicated);
    }
    loadDuplicate();
    return () => {
      cancelled = true;
    };
  }, [duplicateId, supabase]);

  function updateField<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleGenerateBarcode() {
    setForm((prev) => ({ ...prev, barcode: generateBarcode() }));
  }

  function handleGenerateSku() {
    const category = categories.find((c) => c.id === form.category_id);
    const sku = generateSku(category?.name_en, form.brand);
    setForm((prev) => ({ ...prev, sku }));
  }

  function handleAddTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !form.tags.includes(tag)) {
        updateField("tags", [...form.tags, tag]);
      }
      setTagInput("");
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    updateField("tags", form.tags.filter((t) => t !== tagToRemove));
  }

  async function saveProduct(asDraft: boolean) {
    if (!form.sku.trim() || !form.name_en.trim()) {
      toast.error(L.skuNameRequired);
      return;
    }

    if (form.variants.length === 0) {
      toast.error(isAr ? "ضيف متغير واحد على الأقل." : "Add at least one variant.");
      return;
    }

    // On a real (non-draft) save, every variant needs a valid price + cost.
    if (!asDraft) {
      for (const [idx, v] of form.variants.entries()) {
        const price = parseFloat(v.price);
        const costPrice = parseFloat(v.cost_price);
        if (isNaN(price) || price < 0) {
          toast.error(
            isAr ? `سعر المتغير رقم ${idx + 1} غير صحيح.` : `Variant ${idx + 1}: invalid price.`
          );
          return;
        }
        if (isNaN(costPrice) || costPrice < 0) {
          toast.error(
            isAr ? `سعر تكلفة المتغير رقم ${idx + 1} غير صحيح.` : `Variant ${idx + 1}: invalid cost price.`
          );
          return;
        }
      }
    }

    const setBusy = asDraft ? setSavingDraft : setLoading;
    setBusy(true);

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
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
        tags: form.tags,
        is_active: asDraft ? false : form.is_active,
        is_featured: asDraft ? false : form.is_featured,
      } as never)
      .select("id")
      .single();

    if (productError || !product) {
      setBusy(false);
      toast.error(productError?.message ?? L.productFailed);
      return;
    }

    const productId = (product as { id: string }).id;
    const { data: auth } = await supabase.auth.getUser();

    for (const [idx, v] of form.variants.entries()) {
      const price = parseFloat(v.price);
      const costPrice = parseFloat(v.cost_price);
      const weight = v.weight.trim() === "" ? null : parseFloat(v.weight);

      const { data: insertedVariant, error: variantError } = await supabase
        .from("product_variants")
        .insert({
          product_id: productId,
          size: v.size.trim() || null,
          color: v.color.trim() || null,
          weight: weight != null && !isNaN(weight) ? weight : null,
          price: isNaN(price) ? 0 : price,
          cost_price: isNaN(costPrice) ? 0 : costPrice,
          barcode: v.barcode.trim() || null,
          is_active: asDraft ? false : v.is_active,
        } as never)
        .select("id")
        .single();

      if (variantError || !insertedVariant) {
        setBusy(false);
        toast.error(
          `${L.variantFailed} (${idx + 1}): ${variantError?.message ?? ""}`
        );
        return;
      }

      const variantId = (insertedVariant as { id: string }).id;

      // Insert opening stock for this variant if a quantity + warehouse were chosen.
      const qty = parseFloat(v.quantity);
      const minQty = parseFloat(v.min_qty);
      if (!isNaN(qty) && qty > 0 && form.warehouse_id) {
        const { error: stockErr } = await supabase.from("stock").insert({
          product_id: productId,
          variant_id: variantId,
          warehouse_id: form.warehouse_id,
          quantity: qty,
          min_quantity: isNaN(minQty) ? 0 : minQty,
        } as never);
        if (stockErr) {
          // Non-fatal: product + variant are saved; warn but don't roll back.
          toast.error(`${L.stockFailed}: ${stockErr.message}`);
        } else if (auth?.user) {
          await supabase.from("stock_movements").insert({
            type: "adjustment",
            product_id: productId,
            variant_id: variantId,
            quantity: qty,
            to_warehouse_id: form.warehouse_id,
            reference_type: "product_creation",
            reference_id: productId,
            notes: "Initial stock on product creation",
            created_by: auth.user.id,
          } as never);
        }
      }
    }

    setBusy(false);
    toast.success(asDraft ? L.draftSaved : L.ok);
    router.push(`/${locale}/products`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await saveProduct(false);
  }

  async function handleSaveDraft() {
    await saveProduct(true);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/products`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-paws-brown">
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
              <Label htmlFor="sku">SKU *</Label>
              <div className="flex gap-2">
                <Input
                  id="sku"
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  placeholder={L.skuPh}
                  className="bg-white border-paws-sand flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateSku}
                  className="gap-1.5 border-paws-sand shrink-0"
                  title={L.autoTitle}
                >
                  <Sparkles className="w-4 h-4" /> {L.auto}
                </Button>
              </div>
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

        {/* Product Images */}
        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <h2 className="font-semibold text-paws-brown-dark text-lg">{L.images}</h2>
          <p className="text-sm text-muted-foreground">{L.imagesNote}</p>
          <ImageUploader
            bucket="product-images"
            folder="products"
            images={form.images}
            onChange={(urls) => updateField("images", urls)}
            maxImages={10}
          />
        </div>

        {/* Classification */}
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

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags">{L.tags}</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-paws-cream text-paws-brown px-2.5 py-1 rounded-full text-xs font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder={L.tagsPh}
              className="bg-white border-paws-sand"
            />
            <p className="text-xs text-muted-foreground mt-1">{L.tagsNote}</p>
          </div>
        </div>

        <VariantEditor
          variants={form.variants}
          onVariantsChange={(next) => updateField("variants", next)}
          warehouses={warehouses}
          warehouseId={form.warehouse_id}
          onWarehouseChange={(id) => updateField("warehouse_id", id)}
          isAr={isAr}
        />

        {/* Status */}
        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <h2 className="font-semibold text-paws-brown-dark text-lg">{L.statusVis}</h2>

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

        {/* Submit */}
        <div className="flex flex-wrap gap-3 justify-end">
          <Link href={`/${locale}/products`}>
            <Button type="button" variant="outline" className="border-paws-sand">
              {L.cancel}
            </Button>
          </Link>
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={loading || savingDraft}
            className="border-paws-sand gap-1.5"
          >
            {savingDraft && <Loader2 className="w-4 h-4 animate-spin" />}
            {savingDraft ? L.draftSaving : L.saveDraft}
          </Button>
          <Button
            type="submit"
            disabled={loading || savingDraft}
            className="bg-paws-orange hover:bg-paws-orange/90 text-white gap-1.5"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? L.creating : L.create}
          </Button>
        </div>
      </form>
    </div>
  );
}
