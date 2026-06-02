# Multi-Weight Product Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let staff create a single product with multiple weight variants (each with its own price, cost, opening stock, and low-stock threshold) directly on the Add Product form, in one save.

**Architecture:** Extract the working variant editor from the Edit page into a shared, controlled `VariantEditor` component (single source of truth), then render it on both the Add and Edit forms. The Add form's save path is reworked to loop-insert variants + per-variant stock + audit movements, mirroring the Edit page's proven insert logic. No database/schema changes — `product_variants` already has every column needed.

**Tech Stack:** Next.js 15 App Router (client components), React 19, TypeScript (strict), Supabase JS client (`@supabase/ssr` browser client), `next-intl`, `sonner` toasts, shadcn/ui + `paws-*` Tailwind theme, `lucide-react` icons.

**Testing reality:** Per `CLAUDE.md`, this repo has **no test runner / linter / formatter**. The type gate is `npm run build` (or `npx tsc --noEmit`). Verification is type-check + manual dev-server checks. Each task ends with a build/type gate and a commit; the final task is end-to-end manual verification.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/components/dashboard/VariantEditor.tsx` | Shared, controlled variant editor: `VariantRow` type, `newVariantRow()`, and the variant-cards UI + warehouse selector + "Add variant" button. Owns no persistence. | **Create** |
| `src/app/[locale]/(dashboard)/products/[id]/edit/page.tsx` | Edit product. Now imports `VariantEditor`; inline variant UI/helpers removed. Save logic unchanged; `removedVariantIds` derived by diffing in the change handler. | **Modify** |
| `src/app/[locale]/(dashboard)/products/new/page.tsx` | Add product. `ProductForm` loses flat price/cost/qty fields, gains `variants: VariantRow[]`. Renders `VariantEditor`. Save loop-inserts variants + stock + movements. Duplicate copies all variants. | **Modify** |

Build order: **Task 1** creates the shared component. **Task 2** refactors Edit to use it (proves the extraction is behavior-preserving in the page that already works). **Task 3** reworks Add. **Task 4** upgrades Duplicate. **Task 5** is end-to-end manual verification.

---

### Task 1: Create the shared `VariantEditor` component

**Files:**
- Create: `src/components/dashboard/VariantEditor.tsx`

This component is lifted **verbatim** (markup, classes, bilingual labels) from the Edit page's existing variant block (`src/app/[locale]/(dashboard)/products/[id]/edit/page.tsx:25-55` for the type/factory and `:700-883` for the JSX + the `addVariant`/`removeVariant`/`updateVariant` handlers). It is a controlled component: the parent owns the `variants` array and the warehouse selection.

- [ ] **Step 1: Create the file with the type, factory, props, and barcode helper**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

export interface VariantRow {
  // Existing variant id, or null for a new (unsaved) row.
  id: string | null;
  size: string;
  weight: string;
  color: string;
  price: string;
  cost_price: string;
  barcode: string;
  is_active: boolean;
  // Per-variant stock for the selected warehouse.
  stock_row_id: string | null;
  quantity: string;
  min_qty: string;
}

export function newVariantRow(): VariantRow {
  return {
    id: null,
    size: "",
    weight: "",
    color: "",
    price: "",
    cost_price: "",
    barcode: "",
    is_active: true,
    stock_row_id: null,
    quantity: "0",
    min_qty: "0",
  };
}

interface VariantEditorProps {
  variants: VariantRow[];
  onVariantsChange: (next: VariantRow[]) => void;
  warehouses: Array<{ id: string; name: string }>;
  warehouseId: string;
  onWarehouseChange: (id: string) => void;
  isAr: boolean;
}

export function VariantEditor({
  variants,
  onVariantsChange,
  warehouses,
  warehouseId,
  onWarehouseChange,
  isAr,
}: VariantEditorProps) {
  const L = {
    sellingPrice: isAr ? "سعر البيع" : "Selling Price",
    costPrice: isAr ? "سعر التكلفة" : "Cost Price",
    egp: isAr ? "ج.م" : "EGP",
  };

  function updateVariant(idx: number, patch: Partial<VariantRow>) {
    onVariantsChange(variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  }

  function addVariant() {
    onVariantsChange([...variants, newVariantRow()]);
  }

  function removeVariant(idx: number) {
    const next = variants.filter((_, i) => i !== idx);
    onVariantsChange(next.length === 0 ? [newVariantRow()] : next);
  }

  return (
    <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-paws-brown-dark text-lg">
            {isAr ? "المتغيرات (الأحجام / النكهات)" : "Variants (sizes / flavors)"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr
              ? "كل متغير له سعر ومخزون مستقل. اترك الحجم/النكهة فاضي لو المنتج له نسخة واحدة بس."
              : "Each variant has its own price and stock. Leave size/flavor empty if the product has a single version."}
          </p>
        </div>
        <div className="space-y-1.5 shrink-0 min-w-[180px]">
          <Label htmlFor="warehouse_id">{isAr ? "المستودع" : "Warehouse"}</Label>
          {warehouses.length === 0 ? (
            <p className="text-xs text-red-600 pt-2">
              {isAr ? "ضيف مستودع أولاً" : "Create a warehouse first"}
            </p>
          ) : (
            <select
              id="warehouse_id"
              name="warehouse_id"
              value={warehouseId}
              onChange={(e) => onWarehouseChange(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-paws-sand bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {variants.map((v, idx) => (
          <div
            key={v.id ?? `new-${idx}`}
            className="rounded-xl border border-paws-sand p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-paws-brown-dark">
                {isAr ? `متغير رقم ${idx + 1}` : `Variant ${idx + 1}`}
              </span>
              {variants.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVariant(idx)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  {isAr ? "حذف" : "Remove"}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "الحجم (مثلا 2kg)" : "Size (e.g. 2kg)"}</Label>
                <Input
                  value={v.size}
                  onChange={(e) => updateVariant(idx, { size: e.target.value })}
                  placeholder="2kg"
                  className="bg-white border-paws-sand"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "الوزن بالكيلو (اختياري)" : "Weight in kg (optional)"}</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={v.weight}
                  onChange={(e) => updateVariant(idx, { weight: e.target.value })}
                  placeholder="2"
                  className="bg-white border-paws-sand"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "النكهة / اللون" : "Flavor / Color"}</Label>
                <Input
                  value={v.color}
                  onChange={(e) => updateVariant(idx, { color: e.target.value })}
                  placeholder={isAr ? "مثلا: دجاج" : "e.g. Chicken"}
                  className="bg-white border-paws-sand"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{L.sellingPrice} ({L.egp}) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={v.price}
                  onChange={(e) => updateVariant(idx, { price: e.target.value })}
                  placeholder="0.00"
                  className="bg-white border-paws-sand"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{L.costPrice} ({L.egp}) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={v.cost_price}
                  onChange={(e) => updateVariant(idx, { cost_price: e.target.value })}
                  placeholder="0.00"
                  className="bg-white border-paws-sand"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "الكمية" : "Quantity"}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={v.quantity}
                  onChange={(e) => updateVariant(idx, { quantity: e.target.value })}
                  className="bg-white border-paws-sand"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "الحد الأدنى" : "Low-stock"}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={v.min_qty}
                  onChange={(e) => updateVariant(idx, { min_qty: e.target.value })}
                  className="bg-white border-paws-sand"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Label className="text-xs text-muted-foreground">
                {isAr ? "باركود المتغير (اختياري)" : "Variant barcode (optional)"}
              </Label>
              <Input
                value={v.barcode}
                onChange={(e) => updateVariant(idx, { barcode: e.target.value })}
                className="bg-white border-paws-sand w-48 h-8 text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addVariant}
        className="gap-1.5 border-paws-sand"
      >
        <Plus className="w-4 h-4" />
        {isAr ? "ضيف متغير" : "Add variant"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Type-check the new component**

Run: `cd "/Volumes/External5TB/05_Backups/Mac-2026-04-25/Downloads/paws egypt" && npx tsc --noEmit`
Expected: PASS (no errors). The component is not yet imported anywhere, so this only proves it compiles in isolation.

- [ ] **Step 3: Commit**

```bash
git add "src/components/dashboard/VariantEditor.tsx"
git commit -m "feat(products): extract shared VariantEditor component"
```

---

### Task 2: Refactor the Edit page to use `VariantEditor`

**Files:**
- Modify: `src/app/[locale]/(dashboard)/products/[id]/edit/page.tsx`

Goal: remove the now-duplicated inline `VariantRow`/`newVariantRow` and the variant-cards JSX + `addVariant`/`removeVariant`/`updateVariant`, replacing them with the shared component. **The save logic (`handleSubmit`) does not change.** `removedVariantIds` continues to work via diffing inside the change handler.

- [ ] **Step 1: Swap the imports**

In the import block (currently `:1-17`), remove `Plus, Trash2` from the `lucide-react` import (they move into `VariantEditor`), and add an import for the shared component + types. The `lucide-react` line currently reads:

```tsx
import { ArrowLeft, Loader2, Barcode, Plus, Trash2, GitMerge } from "lucide-react";
```

Change it to:

```tsx
import { ArrowLeft, Loader2, Barcode, GitMerge } from "lucide-react";
import { VariantEditor, newVariantRow, type VariantRow } from "@/components/dashboard/VariantEditor";
```

- [ ] **Step 2: Delete the now-shared `VariantRow` interface and `newVariantRow` factory**

Delete the local declarations at `:25-55` (the `interface VariantRow { … }` block and the `function newVariantRow(): VariantRow { … }` block). They are now imported from `VariantEditor`. Leave `generateBarcode()` (`:57-69`) in place — Edit still uses it for the product-level barcode.

- [ ] **Step 3: Delete the now-shared variant handlers**

Delete `updateVariant` (`:494-496`), `addVariant` (`:498-500`), and `removeVariant` (`:502-511`). The component now owns these. Keep `removedVariantIds` state (`:150`) and `handleSubmit` (`:285-492`) exactly as they are.

- [ ] **Step 4: Add a change handler that preserves `removedVariantIds` by diffing**

Immediately after the `setVariants`/`setRemovedVariantIds` state declarations (around `:150`), add a handler that updates the array and records any saved variant that disappeared:

```tsx
function handleVariantsChange(next: VariantRow[]) {
  setVariants((prev) => {
    const nextIds = new Set(next.map((v) => v.id).filter(Boolean) as string[]);
    const removed = prev
      .map((v) => v.id)
      .filter((id): id is string => Boolean(id) && !nextIds.has(id));
    if (removed.length > 0) {
      setRemovedVariantIds((ids) => [...ids, ...removed]);
    }
    return next;
  });
}
```

- [ ] **Step 5: Replace the inline variant block with the component**

Delete the entire `{/* Variants */}` block (`:701-883`, the outer `<div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">` that contains the variants header, warehouse selector, the `variants.map(...)` cards, and the "Add variant" button). Replace it with:

```tsx
        <VariantEditor
          variants={variants}
          onVariantsChange={handleVariantsChange}
          warehouses={warehouses}
          warehouseId={form.warehouse_id}
          onWarehouseChange={(id) => updateField("warehouse_id", id)}
          isAr={isAr}
        />
```

- [ ] **Step 6: Type-check**

Run: `cd "/Volumes/External5TB/05_Backups/Mac-2026-04-25/Downloads/paws egypt" && npx tsc --noEmit`
Expected: PASS. If it complains about an unused `L.sellingPrice`/`L.costPrice`/`L.egp` in the Edit file, those entries in Edit's `L` object are now unused (the component has its own copy) — remove `sellingPrice`, `costPrice`, `egp` from Edit's `L` object (`:108-111`) to clear the warning. (TypeScript won't error on unused object properties, so this is optional cleanup, not a blocker.)

- [ ] **Step 7: Commit**

```bash
git add "src/app/[locale]/(dashboard)/products/[id]/edit/page.tsx"
git commit -m "refactor(products): use shared VariantEditor on edit page"
```

---

### Task 3: Rework the Add page to create multiple variants

**Files:**
- Modify: `src/app/[locale]/(dashboard)/products/new/page.tsx`

Goal: replace the single flat price/cost/qty fields with a `variants: VariantRow[]` array rendered via `VariantEditor`, and rewrite `saveProduct` to loop-insert variants + per-variant stock + audit movements.

- [ ] **Step 1: Swap the imports**

The current `lucide-react` import (`:11`) is:

```tsx
import { ArrowLeft, Loader2, Barcode, Sparkles, X } from "lucide-react";
```

Keep it as-is (Add still uses all of these for product-level fields/tags). Add the component import directly below the `RichTextEditor` import (`:15`):

```tsx
import { VariantEditor, newVariantRow, type VariantRow } from "@/components/dashboard/VariantEditor";
```

- [ ] **Step 2: Update the `ProductForm` interface**

Replace the flat pricing/stock fields with a variants array. The current interface (`:23-42`) has `price`, `cost_price`, `initial_qty`, `min_qty`. Change the interface to:

```tsx
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
```

- [ ] **Step 3: Update `INITIAL_FORM`**

The current `INITIAL_FORM` (`:49-68`) sets `price`, `cost_price`, `initial_qty`, `min_qty`. Replace it with:

```tsx
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
```

- [ ] **Step 4: Update the duplicate-loader to copy all variants (deferred to Task 4 for the full version; minimal fix here)**

The duplicate `useEffect` (`:216-268`) currently reads `product_variants(price, cost_price)` and copies only the first variant's price/cost into the removed flat fields. For now, to keep this task compiling, change the `setForm(...)` call inside `loadDuplicate` so it builds `variants` instead of `price`/`cost_price`/`initial_qty`/`min_qty`. Replace the `setForm({...})` object (`:242-261`) with:

```tsx
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
```

(Task 4 upgrades the query to fetch *all* variants and copy each.)

- [ ] **Step 5: Rewrite `saveProduct` to loop-insert variants + stock + movements**

Replace the entire `saveProduct` function (`:306-414`) with the following. It keeps the draft/active rules, validates every variant, inserts the product once, then loops the variants:

```tsx
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
```

- [ ] **Step 6: Replace the Pricing + Stock JSX sections with `<VariantEditor>`**

Delete the entire `{/* Pricing */}` section (`:637-691`) and the entire `{/* Stock */}` section (`:693-748`). Replace both with a single component instance (place it where the Pricing section was, after the Classification card and before the Status card):

```tsx
        <VariantEditor
          variants={form.variants}
          onVariantsChange={(next) => updateField("variants", next)}
          warehouses={warehouses}
          warehouseId={form.warehouse_id}
          onWarehouseChange={(id) => updateField("warehouse_id", id)}
          isAr={isAr}
        />
```

- [ ] **Step 7: Remove now-unused `L` strings (optional cleanup)**

The `L` object (`:114-180`) still contains keys only used by the deleted flat Pricing/Stock UI: `pricing`, `sellingPrice`, `costPrice`, `egp`, `profitMargin`, `priceInvalid`, `costInvalid`, `stock`, `stockNote`, `initialQty`, `warehouse`, `minQty`, `noWarehouses`. The `VariantEditor` supplies its own labels, so these are dead. Removing them is optional (unused object properties don't fail `tsc`), but do remove `priceInvalid` and `costInvalid` references if you deleted them — they were only used in the old `saveProduct`, which is now replaced. Leave `skuNameRequired`, `productFailed`, `variantFailed`, `stockFailed`, `draftSaved`, `ok`, `duplicated` — the new `saveProduct` uses them. **Verify by search:** after editing, `grep -n "L\.priceInvalid\|L\.costInvalid" src/app/\[locale\]/\(dashboard\)/products/new/page.tsx` should return nothing.

- [ ] **Step 8: Type-check**

Run: `cd "/Volumes/External5TB/05_Backups/Mac-2026-04-25/Downloads/paws egypt" && npx tsc --noEmit`
Expected: PASS. Common failures to fix: leftover references to `form.price` / `form.cost_price` / `form.initial_qty` / `form.min_qty` anywhere in the JSX (e.g. the profit-margin block `:675-690` must be gone — it lived inside the deleted Pricing section). If `tsc` flags any, delete those references.

- [ ] **Step 9: Commit**

```bash
git add "src/app/[locale]/(dashboard)/products/new/page.tsx"
git commit -m "feat(products): create multiple weight variants from add form"
```

---

### Task 4: Upgrade Duplicate to copy all variants

**Files:**
- Modify: `src/app/[locale]/(dashboard)/products/new/page.tsx`

Goal: when duplicating, copy **every** variant of the source product (size/weight/color/price/cost), not just the first. Stock is intentionally NOT copied (opening stock starts at 0).

- [ ] **Step 1: Widen the duplicate query to fetch all variant fields**

In the duplicate `useEffect` (`:216-268`), the select currently fetches `product_variants(price, cost_price)`. Change the `.select(...)` string so it pulls the fields needed to rebuild rows. Replace the select with:

```tsx
        .select(
          "name_en, name_ar, description_en, description_ar, category_id, brand, unit_type, tags, is_active, is_featured, product_variants(size, weight, color, price, cost_price, barcode)",
        )
```

- [ ] **Step 2: Update the local product type used in the loader**

The inline type annotation for `p` (`:228-240`) declares `product_variants: { price: number; cost_price: number }[]`. Replace that type block so it matches the widened query:

```tsx
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
        product_variants: {
          size: string | null;
          weight: number | null;
          color: string | null;
          price: number;
          cost_price: number;
          barcode: string | null;
        }[];
      };
```

- [ ] **Step 3: Build `variants` from all source variants**

The loader currently does `const variant = p.product_variants?.[0];` (`:241`) and builds a single-row `variants` array (from Task 3 Step 4). Replace the `const variant = …;` line and the `variants:` field in the `setForm` object with logic that maps every source variant:

Change `:241` from:

```tsx
      const variant = p.product_variants?.[0];
```

to:

```tsx
      const sourceVariants = p.product_variants ?? [];
```

Then change the `variants:` property inside the `setForm({...})` object (added in Task 3 Step 4) to:

```tsx
        variants:
          sourceVariants.length > 0
            ? sourceVariants.map((sv) => ({
                ...newVariantRow(),
                size: sv.size ?? "",
                weight: sv.weight != null ? String(sv.weight) : "",
                color: sv.color ?? "",
                price: sv.price != null ? String(sv.price) : "",
                cost_price: sv.cost_price != null ? String(sv.cost_price) : "",
                // barcode intentionally not copied — barcodes must be unique per variant.
              }))
            : [newVariantRow()],
```

- [ ] **Step 4: Type-check**

Run: `cd "/Volumes/External5TB/05_Backups/Mac-2026-04-25/Downloads/paws egypt" && npx tsc --noEmit`
Expected: PASS. If `tsc` complains that `variant` is undefined elsewhere, search for stray `variant?.` references left from the old loader and remove them: `grep -n "variant?\." src/app/\[locale\]/\(dashboard\)/products/new/page.tsx`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(dashboard)/products/new/page.tsx"
git commit -m "feat(products): duplicate copies all weight variants"
```

---

### Task 5: End-to-end manual verification

**Files:** none (verification only).

No automated test harness exists in this repo, so this task is a scripted manual pass against the running dev server. Do not skip — this is the real acceptance gate.

- [ ] **Step 1: Production type-check (full build gate)**

Run: `cd "/Volumes/External5TB/05_Backups/Mac-2026-04-25/Downloads/paws egypt" && npm run build`
Expected: build completes with no TypeScript errors. (This is the type gate `CLAUDE.md` defines.)

- [ ] **Step 2: Start the dev server**

Run: `cd "/Volumes/External5TB/05_Backups/Mac-2026-04-25/Downloads/paws egypt" && npm run dev`
Expected: server on `http://localhost:3000`. (Use the preview tooling to drive the browser.)

- [ ] **Step 3: Create a two-weight product**

Navigate to `/en/products/new`. Fill SKU + English name + brand + category. In the Variants section: set Variant 1 = size "4kg", weight 4, price 370, cost 300, quantity 10; click "Add variant"; set Variant 2 = size "20kg", weight 20, price 1400, cost 1150, quantity 5. Pick a warehouse. Click "Create Product".
Expected: success toast, redirect to `/en/products`, the product appears in the list.

- [ ] **Step 4: Verify the DB rows (via Supabase MCP)**

Run a query through the Supabase MCP `execute_sql` tool (project ref `shxnczbvtitnnxyxkkyf`):

```sql
select p.sku, p.name_en, count(distinct pv.id) as variants, count(distinct s.id) as stock_rows
from products p
left join product_variants pv on pv.product_id = p.id
left join stock s on s.product_id = p.id
where p.sku = '<the SKU you used>'
group by p.id, p.sku, p.name_en;
```

Expected: `variants = 2`, `stock_rows = 2`. Also confirm two `stock_movements` rows exist with `reference_type = 'product_creation'` for this product.

- [ ] **Step 5: Verify the storefront weight picker**

Open the product detail page at `/en/shop/<product-id>` (the id is the UUID; copy it from the products list Edit link or the DB query).
Expected: a **weight/size picker** with "4kg" and "20kg" options; selecting each updates the displayed price (370 ↔ 1400). This confirms the existing `VariantPickerAndCart` lights up automatically — no storefront change was needed.

- [ ] **Step 6: Verify the single-weight path still works**

Create another product at `/en/products/new` with **one** variant only (no "Add variant"), price + quantity set.
Expected: success; one `product_variants` row, one `stock` row; on its detail page **no** picker shows (single variant) — identical to pre-change behavior.

- [ ] **Step 7: Verify Save as Draft**

Create a product but click "Save as Draft".
Expected: success toast; in the products list the status badge shows Inactive; the product + its variants have `is_active = false` (verify via the same SQL pattern, checking `p.is_active` and `pv.is_active`); it does NOT appear on `/en/shop`.

- [ ] **Step 8: Verify Duplicate copies all variants**

From the products list, click "Duplicate" on the two-weight product created in Step 3.
Expected: the Add form opens pre-filled with **both** weight rows (4kg and 20kg with their prices/costs), SKU empty, images empty, and quantities reset to 0. Save it under a new SKU and confirm 2 variants are created.

- [ ] **Step 9: Regression — edit an existing product**

Open `/en/products/<id>/edit` for any product. Add a variant, change a price, change a stock quantity, remove a variant, save.
Expected: identical behavior to before the refactor — changes persist, removed variant is deleted, stock movement recorded. (This proves the Task 2 extraction is behavior-preserving.)

- [ ] **Step 10: Stop the dev server and finalize**

Stop `npm run dev`. All checks green → the feature is complete on branch `feat/multi-weight-product-creation`. (PR creation is a separate, user-initiated step.)
```
