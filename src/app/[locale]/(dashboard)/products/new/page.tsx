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
  price: string;
  cost_price: string;
  is_active: boolean;
  is_featured: boolean;
  images: string[];
  tags: string[];
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
  price: "",
  cost_price: "",
  is_active: true,
  is_featured: false,
  images: [],
  tags: [],
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

  const [categories, setCategories] = useState<CategoryOption[]>([]);
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
    loadCategories();
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
        price: variant?.price != null ? String(variant.price) : "",
        cost_price: variant?.cost_price != null ? String(variant.cost_price) : "",
        is_active: p.is_active,
        is_featured: false,
        images: [],
        tags: p.tags ?? [],
      });
      toast.info("Product duplicated. SKU and images cleared.");
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
      toast.error("SKU and English name are required.");
      return;
    }

    const priceRaw = form.price.trim();
    const costRaw = form.cost_price.trim();
    const price = priceRaw === "" ? NaN : parseFloat(priceRaw);
    const costPrice = costRaw === "" ? NaN : parseFloat(costRaw);

    if (!asDraft) {
      if (isNaN(price) || price < 0) {
        toast.error("Please enter a valid selling price.");
        return;
      }
      if (isNaN(costPrice) || costPrice < 0) {
        toast.error("Please enter a valid cost price.");
        return;
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
      toast.error(productError?.message ?? "Failed to create product");
      return;
    }

    const productId = (product as { id: string }).id;

    const { error: variantError } = await supabase
      .from("product_variants")
      .insert({
        product_id: productId,
        size: null,
        color: null,
        weight: null,
        price: isNaN(price) ? 0 : price,
        cost_price: isNaN(costPrice) ? 0 : costPrice,
        barcode: form.barcode.trim() || null,
        is_active: asDraft ? false : form.is_active,
      } as never);

    setBusy(false);

    if (variantError) {
      toast.error(`Product created but variant failed: ${variantError.message}`);
      return;
    }

    toast.success(asDraft ? "Draft saved." : "Product created successfully!");
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
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-paws-brown-dark">
          Add New Product
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <h2 className="font-semibold text-paws-brown-dark text-lg">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU *</Label>
              <div className="flex gap-2">
                <Input
                  id="sku"
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  placeholder="e.g. PAW-DOG-001"
                  className="bg-white border-paws-sand flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateSku}
                  className="gap-1.5 border-paws-sand shrink-0"
                  title="Generate SKU from category + brand"
                >
                  <Sparkles className="w-4 h-4" /> Auto
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                placeholder="e.g. Royal Canin"
                className="bg-white border-paws-sand"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name_en">Name (English) *</Label>
              <Input
                id="name_en"
                name="name_en"
                value={form.name_en}
                onChange={handleChange}
                placeholder="Product name in English"
                className="bg-white border-paws-sand"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name_ar">Name (Arabic)</Label>
              <Input
                id="name_ar"
                name="name_ar"
                value={form.name_ar}
                onChange={handleChange}
                placeholder="اسم المنتج بالعربية"
                className="bg-white border-paws-sand"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="description_en">Description (English)</Label>
              <RichTextEditor
                value={form.description_en}
                onChange={(html) => updateField("description_en", html)}
                placeholder="Product description in English"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description_ar">Description (Arabic)</Label>
              <RichTextEditor
                value={form.description_ar}
                onChange={(html) => updateField("description_ar", html)}
                placeholder="وصف المنتج بالعربية"
                dir="rtl"
              />
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <h2 className="font-semibold text-paws-brown-dark text-lg">
            Product Images
          </h2>
          <p className="text-sm text-muted-foreground">
            Upload up to 10 images. The first image will be the main product image.
          </p>
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
          <h2 className="font-semibold text-paws-brown-dark text-lg">
            Classification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category_id">Category</Label>
              <select
                id="category_id"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="flex h-9 w-full rounded-lg border border-paws-sand bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {locale === "ar" ? cat.name_ar : cat.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unit_type">Unit Type</Label>
              <select
                id="unit_type"
                name="unit_type"
                value={form.unit_type}
                onChange={handleChange}
                className="flex h-9 w-full rounded-lg border border-paws-sand bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="piece">Piece</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="l">Liter (L)</option>
                <option value="ml">Milliliter (mL)</option>
                <option value="pack">Pack</option>
                <option value="box">Box</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="barcode">Barcode</Label>
            <div className="flex gap-2">
              <Input
                id="barcode"
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                placeholder="Enter or generate barcode"
                className="bg-white border-paws-sand flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateBarcode}
                className="gap-1.5 border-paws-sand shrink-0"
              >
                <Barcode className="w-4 h-4" /> Generate
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags</Label>
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
              placeholder="Type a tag and press Enter..."
              className="bg-white border-paws-sand"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Press Enter or comma to add a tag
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <h2 className="font-semibold text-paws-brown-dark text-lg">
            Pricing
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Selling Price (EGP) *</Label>
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
              <Label htmlFor="cost_price">Cost Price (EGP) *</Label>
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

          {form.price && form.cost_price && (
            <div className="bg-paws-cream/50 rounded-xl p-3">
              <p className="text-sm text-paws-brown">
                Profit margin:{" "}
                <span className="font-semibold text-paws-brown-dark">
                  {(
                    ((parseFloat(form.price) - parseFloat(form.cost_price)) /
                      parseFloat(form.price)) *
                    100
                  ).toFixed(1)}
                  %
                </span>{" "}
                ({(parseFloat(form.price) - parseFloat(form.cost_price)).toLocaleString()} EGP)
              </p>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <h2 className="font-semibold text-paws-brown-dark text-lg">
            Status & Visibility
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <Label>Active Status</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Product will be visible when active
              </p>
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
              <Label>Featured Product</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Show this product in featured sections on the website
              </p>
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
              Cancel
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
            {savingDraft ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            type="submit"
            disabled={loading || savingDraft}
            className="bg-paws-orange hover:bg-paws-orange/90 text-white gap-1.5"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
