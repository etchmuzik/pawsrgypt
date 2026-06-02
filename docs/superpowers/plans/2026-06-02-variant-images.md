# Per-Weight Variant Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each weight variant carry an optional image that the shop product page shows when that weight is selected (falling back to the product's main image), editable inside each weight row in both Add and Edit.

**Architecture:** Add a nullable `image_url` column to `product_variants` (guarded migration `0008`, applied to the live DB). The shared `VariantEditor` gains a single-image uploader per row (reusing the existing `ImageUploader`). On the storefront, the PDP's image gallery and the weight picker are siblings in a server component, so a small client wrapper (`ProductGalleryAndPicker`) holds the shared "selected variant" state and renders both — swapping the displayed image to `selectedVariant.image_url ?? productImage`.

**Tech Stack:** Next.js 15 App Router (server + client components), React 19, TypeScript (strict), Supabase JS client, `next-intl`, shadcn/ui, existing `ImageUploader` (HEIC/compress/upload) and `ProductImageZoom` components.

**Testing reality:** No test runner in this repo (`CLAUDE.md`). Gate is `npx tsc --noEmit` / `npm run build` + manual verification + a live DB column check via Supabase MCP. Each task ends with a type-check and a commit.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `supabase/migrations/0008_variant_image.sql` | Add nullable `image_url` to `product_variants` (guarded, idempotent) | **Create** |
| `src/lib/supabase/types.ts` | `product_variants.Row.image_url: string \| null` | **Modify** |
| `src/components/dashboard/VariantEditor.tsx` | `VariantRow.image_url`; per-row single `ImageUploader`; optional `productId` prop | **Modify** |
| `src/app/[locale]/(dashboard)/products/[id]/edit/page.tsx` | Load `image_url` into rows; write in insert + update; pass `productId` to editor | **Modify** |
| `src/app/[locale]/(dashboard)/products/new/page.tsx` | Write `image_url` in `saveProduct`; copy in duplicate loader | **Modify** |
| `src/components/website/VariantPickerAndCart.tsx` | `VariantOption.image_url`; `onVariantChange?` callback fired on selection | **Modify** |
| `src/components/website/ProductGalleryAndPicker.tsx` | Client wrapper holding shared selected state; renders `ProductImageZoom` + `VariantPickerAndCart` | **Create** |
| `src/app/[locale]/(website)/shop/[slug]/page.tsx` | Add `image_url` to PDP select + `VariantOption` mapping; render the wrapper when `showPicker` | **Modify** |

Build order: DB+types first (Task 1), then the dashboard editing path (Tasks 2–4), then the storefront read path (Tasks 5–7), then verification (Task 8).

---

### Task 1: Add `image_url` to product_variants (migration + types)

**Files:**
- Create: `supabase/migrations/0008_variant_image.sql`
- Modify: `src/lib/supabase/types.ts`

- [ ] **Step 1: Write the guarded migration**

Create `supabase/migrations/0008_variant_image.sql`:

```sql
-- 0008_variant_image.sql
-- Per-weight variant images: an optional image per product_variant.
-- NULL means "fall back to the product's main image". Guarded + idempotent.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_variants'
      AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.product_variants ADD COLUMN image_url TEXT;
  END IF;
END $$;

COMMIT;
```

- [ ] **Step 2: Apply the migration to the live DB**

Apply via the Supabase MCP `apply_migration` tool (project `shxnczbvtitnnxyxkkyf`), name `variant_image`, with the body of the migration (the `ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS image_url TEXT;` is simplest for `apply_migration` — but since older PG lacks `ADD COLUMN IF NOT EXISTS` reliability concerns are nil on Supabase PG15+, you may use `ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS image_url TEXT;`). Then verify:

Run (Supabase MCP `execute_sql`):
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='product_variants' AND column_name='image_url';
```
Expected: one row — `image_url | text | YES`.

- [ ] **Step 3: Add the field to types.ts**

In `src/lib/supabase/types.ts`, find the `product_variants` block's `Row` (fields: `id, product_id, size, color, weight, price, cost_price, barcode, is_active, created_at`). Add `image_url: string | null;` to the `Row`. The `Insert`/`Update` are derived via `Omit<...Row, "id" | "created_at">` / `Partial<...Insert>`, so no further edit is needed — `image_url` becomes part of Insert automatically. Concretely, add the line after `barcode: string | null;`:

```ts
          barcode: string | null;
          is_active: boolean;
          image_url: string | null;
          created_at: string;
```
(Match the actual field order in the file; the key requirement is `image_url: string | null;` exists in the `product_variants` Row.)

- [ ] **Step 4: Type-check**

Run: `cd "/Volumes/External5TB/05_Backups/Mac-2026-04-25/Downloads/paws egypt" && npx tsc --noEmit`
Expected: PASS (no errors). The new field is additive; nothing references it yet.

- [ ] **Step 5: Commit**

```bash
git add "supabase/migrations/0008_variant_image.sql" "src/lib/supabase/types.ts"
git commit -m "feat(db): add nullable image_url to product_variants"
```

---

### Task 2: Add a per-row image uploader to VariantEditor

**Files:**
- Modify: `src/components/dashboard/VariantEditor.tsx`

- [ ] **Step 1: Import ImageUploader and extend the row type**

At the top of `VariantEditor.tsx`, add the import (alongside the existing imports):
```tsx
import { ImageUploader } from "@/components/dashboard/ImageUploader";
```
In the `VariantRow` interface, add `image_url: string;` (after `barcode: string;`). In `newVariantRow()`, add `image_url: "",` to the returned object.

- [ ] **Step 2: Add an optional productId prop**

Extend `VariantEditorProps` with `productId?: string;` and destructure it in the component signature:
```tsx
interface VariantEditorProps {
  variants: VariantRow[];
  onVariantsChange: (next: VariantRow[]) => void;
  warehouses: Array<{ id: string; name: string }>;
  warehouseId: string;
  onWarehouseChange: (id: string) => void;
  isAr: boolean;
  productId?: string;
}
```
```tsx
export function VariantEditor({
  variants,
  onVariantsChange,
  warehouses,
  warehouseId,
  onWarehouseChange,
  isAr,
  productId,
}: VariantEditorProps) {
```

- [ ] **Step 3: Render the per-row uploader**

Inside the per-variant card JSX, after the variant-barcode row (the `<div className="flex items-center justify-between pt-1">...barcode Input...</div>`), add an image slot:
```tsx
                <div className="space-y-1 pt-1">
                  <Label className="text-xs text-muted-foreground">
                    {isAr ? "صورة هذا الوزن (اختياري)" : "Image for this weight (optional)"}
                  </Label>
                  <ImageUploader
                    bucket="product-images"
                    folder={`variants/${productId ?? "new"}`}
                    images={v.image_url ? [v.image_url] : []}
                    onChange={(urls) => updateVariant(idx, { image_url: urls[0] ?? "" })}
                    maxImages={1}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {isAr
                      ? "لو فاضي، هتظهر صورة المنتج الرئيسية."
                      : "If empty, the product's main image is shown."}
                  </p>
                </div>
```

- [ ] **Step 4: Type-check**

Run: `cd "/Volumes/External5TB/05_Backups/Mac-2026-04-25/Downloads/paws egypt" && npx tsc --noEmit`
Expected: PASS. (The Edit/Add pages don't yet pass `productId` or read `image_url` — that's fine; `productId` is optional and `image_url` defaults to `""`. The existing pages still compile because `VariantRow` now has `image_url` but `newVariantRow()` supplies it, and the edit page builds rows via `newVariantRow()` spreads in later tasks — if tsc flags that the edit page's row construction is missing `image_url`, that is fixed in Task 3. If a tsc error appears in edit/page.tsx or new/page.tsx referencing `image_url`, proceed to Tasks 3/4 which add it; to keep THIS task green, ensure any object literal building a `VariantRow` in those files spreads `newVariantRow()` — if they construct rows inline without spread, add `image_url: ""`. Verify with the build; if green, continue.)

NOTE: If Step 4 surfaces errors in `edit/page.tsx` because it maps DB variants into `VariantRow` objects literally (not via `newVariantRow()` spread), do the minimal fix in THIS commit: add `image_url: v.image_url ?? ""` to that mapping (full wiring still happens in Task 3). Prefer keeping each commit green.

- [ ] **Step 5: Commit**

```bash
git add "src/components/dashboard/VariantEditor.tsx"
git commit -m "feat(products): per-weight image uploader in VariantEditor"
```

---

### Task 3: Wire image_url through the Edit page

**Files:**
- Modify: `src/app/[locale]/(dashboard)/products/[id]/edit/page.tsx`

- [ ] **Step 1: Select image_url when loading variants**

Find the variants load query (`supabase.from("product_variants").select("*")...`). `select("*")` already returns `image_url`, so no query change is needed. In the code that maps each loaded `ProductVariant` into a `VariantRow` (the `loadedVariants.map((v, idx) => ({ ... }))`), add:
```tsx
              image_url: v.image_url ?? "",
```
to the returned row object (alongside `size`, `weight`, etc.). If the local `ProductVariant` type doesn't include `image_url`, it now does via the regenerated `types.ts` (Task 1), so `v.image_url` is typed.

- [ ] **Step 2: Pass productId to the editor**

Find the `<VariantEditor ... />` usage and add the `productId` prop:
```tsx
        <VariantEditor
          variants={variants}
          onVariantsChange={handleVariantsChange}
          warehouses={warehouses}
          warehouseId={form.warehouse_id}
          onWarehouseChange={(id) => updateField("warehouse_id", id)}
          isAr={isAr}
          productId={productId}
        />
```

- [ ] **Step 3: Persist image_url on insert AND update**

In `handleSubmit`, find the `variantPayload` object (used for both update and insert of `product_variants`). Add `image_url` to it:
```tsx
      const variantPayload = {
        product_id: productId,
        size: v.size.trim() || null,
        weight: weight != null && !isNaN(weight) ? weight : null,
        color: v.color.trim() || null,
        price,
        cost_price: costPrice,
        barcode: v.barcode.trim() || null,
        is_active: v.is_active,
        image_url: v.image_url.trim() || null,
      };
```
(There is a single `variantPayload` reused for both branches, so one edit covers insert + update.)

- [ ] **Step 4: Type-check**

Run: `cd "/Volumes/External5TB/05_Backups/Mac-2026-04-25/Downloads/paws egypt" && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(dashboard)/products/[id]/edit/page.tsx"
git commit -m "feat(products): edit page reads + writes per-weight image"
```

---

### Task 4: Wire image_url through the Add page (create + duplicate)

**Files:**
- Modify: `src/app/[locale]/(dashboard)/products/new/page.tsx`

- [ ] **Step 1: Persist image_url on variant insert**

In `saveProduct`, find the `product_variants` insert object inside the variants loop. Add `image_url`:
```tsx
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
          image_url: v.image_url.trim() || null,
        } as never)
```

- [ ] **Step 2: Copy image_url in the duplicate loader**

In the duplicate `useEffect`, widen the `product_variants(...)` select to include `image_url`, and the local `p` type's `product_variants` element type to include `image_url: string | null`. Then in the `sourceVariants.map((sv) => ({ ...newVariantRow(), ... }))`, add:
```tsx
                image_url: sv.image_url ?? "",
```
Concretely the select becomes:
```tsx
        .select(
          "name_en, name_ar, description_en, description_ar, category_id, brand, unit_type, tags, is_active, is_featured, product_variants(size, weight, color, price, cost_price, barcode, image_url)",
        )
```
and the `p` type's variant element gains `barcode: string | null; image_url: string | null;` (add `image_url` to the existing inline type). The mapper adds `image_url: sv.image_url ?? ""`.

- [ ] **Step 3: (Optional) pass productId to the editor on Add**

The Add form doesn't have a product id until after save, so leave the `VariantEditor` usage without `productId` (it defaults the folder to `variants/new`). No change needed. (Uploaded images are referenced by absolute URL; the folder is only an organizational path.)

- [ ] **Step 4: Type-check**

Run: `cd "/Volumes/External5TB/05_Backups/Mac-2026-04-25/Downloads/paws egypt" && npx tsc --noEmit`
Expected: PASS. If tsc flags a leftover `sv.` field or the `p` type mismatch, align the inline type with the widened select.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(dashboard)/products/new/page.tsx"
git commit -m "feat(products): add form writes per-weight image; duplicate copies it"
```

---

### Task 5: Add image_url to VariantPickerAndCart + selection callback

**Files:**
- Modify: `src/components/website/VariantPickerAndCart.tsx`

- [ ] **Step 1: Extend VariantOption + props**

Add `image_url: string | null;` to the exported `VariantOption` interface (after `quantity`). Add an optional callback to `VariantPickerAndCartProps`:
```tsx
interface VariantPickerAndCartProps {
  productId: string;
  nameEn: string;
  nameAr: string;
  imageUrl: string;
  variants: VariantOption[];
  onVariantChange?: (variant: VariantOption) => void;
}
```
Destructure `onVariantChange` in the signature.

- [ ] **Step 2: Fire the callback when selection changes**

The component holds `const [selected, setSelected] = useState<VariantOption>(pickInitial);`. There are `setSelected(...)` calls in the size/color pickers. Rather than edit each call site, add an effect that notifies the parent whenever `selected` changes, plus an initial fire:
```tsx
  useEffect(() => {
    onVariantChange?.(selected);
  }, [selected, onVariantChange]);
```
Add `useEffect` to the React import at the top: `import { useEffect, useMemo, useState } from "react";`.

- [ ] **Step 3: Type-check**

Run: `cd "/Volumes/External5TB/05_Backups/Mac-2026-04-25/Downloads/paws egypt" && npx tsc --noEmit`
Expected: PASS. (The PDP page passes `variants` without `image_url` yet — that is added in Task 7. If tsc flags the PDP mapping missing `image_url`, that is expected and fixed in Task 7; to keep THIS commit green, Task 7 must follow. If you need this commit green in isolation, the PDP `variantOptions.map` already constructs `VariantOption` literally, so add `image_url: null` there now — but prefer doing the real wiring in Task 7. Choose: make the minimal `image_url: null` addition to the PDP map here to stay green, then Task 7 replaces it with the real value.)

To keep this commit green, ALSO make this minimal edit in `src/app/[locale]/(website)/shop/[slug]/page.tsx`: in the `variantOptions: VariantOption[] = activeVariants.map((v) => ({ ... }))`, add `image_url: null,` (Task 7 upgrades it to the real column). Commit both files together.

- [ ] **Step 4: Commit**

```bash
git add "src/components/website/VariantPickerAndCart.tsx" "src/app/[locale]/(website)/shop/[slug]/page.tsx"
git commit -m "feat(shop): variant picker exposes selected variant + image_url field"
```

---

### Task 6: Create the ProductGalleryAndPicker client wrapper

**Files:**
- Create: `src/components/website/ProductGalleryAndPicker.tsx`

This wrapper owns the shared "selected variant image" state and renders the full two-column grid: the **left image cell** (which swaps to the selected weight's image) and the **right column** containing the server-rendered product info (passed as `children`) followed by the embedded `VariantPickerAndCart`. This is the idiomatic Next.js pattern: server-rendered RSC output (brand/name/description/features) is passed as `children` into a client component, which can hold interactive state without those server nodes becoming client components.

Why this shape: on the PDP today the `VariantPickerAndCart` is the LAST block inside the rich info (right) column, beneath brand/name/category/rating/description/features. The image is in the separate left column. To swap the image on selection, the image and the picker must share state — so one client component must span both columns. It renders the grid itself; the server passes the info block as `children`.

- [ ] **Step 1: Create the component**

Create `src/components/website/ProductGalleryAndPicker.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { ProductImageZoom } from "@/components/website/ProductImageZoom";
import {
  VariantPickerAndCart,
  type VariantOption,
} from "@/components/website/VariantPickerAndCart";

interface ProductGalleryAndPickerProps {
  productId: string;
  nameEn: string;
  nameAr: string;
  productImageUrl: string;
  variants: VariantOption[];
  /** Server-rendered info (brand, name, category, rating, description, features). */
  children?: React.ReactNode;
}

/**
 * Spans both PDP columns so the product image (left) and the weight picker
 * (right, below `children`) share "selected variant" state. When the shopper
 * selects a weight, the main image swaps to that weight's image if it has one,
 * else falls back to the product's main image.
 */
export function ProductGalleryAndPicker({
  productId,
  nameEn,
  nameAr,
  productImageUrl,
  variants,
  children,
}: ProductGalleryAndPickerProps) {
  const [variantImage, setVariantImage] = useState<string | null>(null);
  const displayedImage = variantImage ?? (productImageUrl || null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
      {/* Left: image (swaps with selected weight) */}
      <div>
        {displayedImage ? (
          <ProductImageZoom src={displayedImage} alt={nameEn} />
        ) : (
          <div className="bg-neutral-50 rounded-3xl overflow-hidden border border-neutral-100">
            <div className="aspect-square flex items-center justify-center p-8">
              <div className="w-24 h-24 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <Package className="w-10 h-10 text-neutral-300" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: server info + picker */}
      <div className="flex flex-col gap-5">
        {children}
        <VariantPickerAndCart
          productId={productId}
          nameEn={nameEn}
          nameAr={nameAr}
          imageUrl={productImageUrl}
          variants={variants}
          onVariantChange={(v) => setVariantImage(v.image_url ?? null)}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd "/Volumes/External5TB/05_Backups/Mac-2026-04-25/Downloads/paws egypt" && npx tsc --noEmit`
Expected: PASS. (Not yet used; compiles in isolation.)

- [ ] **Step 3: Commit**

```bash
git add "src/components/website/ProductGalleryAndPicker.tsx"
git commit -m "feat(shop): ProductGalleryAndPicker wrapper sharing selected-variant image"
```

---

### Task 7: Use the wrapper on the PDP and select the real image_url

**Files:**
- Modify: `src/app/[locale]/(website)/shop/[slug]/page.tsx`

The current PDP renders (around line 232) one `<div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">` with a left "Product Image" cell (`ScrollReveal` + `ProductImageZoom`/placeholder) and a right "Product Info" cell (`ScrollReveal` containing brand, name, category, rating, an `!showPicker` price/stock block, description, features, and then the `showPicker ? <VariantPickerAndCart/> : <single AddToCartButton/Notify>` block). We replace that whole grid with a branch: when `showPicker`, use the wrapper (image reacts to selection); otherwise keep today's markup verbatim.

- [ ] **Step 1: Add image_url to the PDP variant select**

In `getPdpData`, update the products select's `product_variants(...)` to include `image_url`:
```tsx
        "id, name_en, name_ar, description_en, description_ar, brand, category_id, images, is_featured, categories(name_en, name_ar), product_variants(id, price, size, weight, color, is_active, image_url), stock(quantity, variant_id)"
```
If a `ProductDetail` type in this file describes the `product_variants` element shape, add `image_url: string | null` to it.

- [ ] **Step 2: Map the real image_url into variantOptions**

In `variantOptions: VariantOption[] = activeVariants.map((v) => ({ ... }))`, replace the placeholder `image_url: null,` (added in Task 5) with:
```tsx
      image_url: v.image_url ?? null,
```

- [ ] **Step 3: Import the wrapper**

At the top of the file, add:
```tsx
import { ProductGalleryAndPicker } from "@/components/website/ProductGalleryAndPicker";
```

- [ ] **Step 4: Branch the two-column grid on showPicker**

Replace the existing `<div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16"> ... </div>` (the one wrapping the Product Image cell + Product Info cell, ~line 232 to the close of that grid just before the related-products section) with the following. The `!showPicker` branch is the EXISTING markup moved verbatim; the `showPicker` branch passes the info block (everything in the right column EXCEPT the picker) as `children` and lets the wrapper render the image + picker.

```tsx
        {showPicker ? (
          <ProductGalleryAndPicker
            productId={productId}
            nameEn={nameEn}
            nameAr={nameAr}
            productImageUrl={imageUrl ?? ""}
            variants={variantOptions}
          >
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
          </ProductGalleryAndPicker>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
            {/* ===== EXISTING MARKUP — paste the current grid's children here verbatim ===== */}
            {/* Product Image cell (ScrollReveal + ProductImageZoom/placeholder) */}
            {/* Product Info cell (ScrollReveal: brand, name, category, rating, the */}
            {/* !showPicker price/stock block, description, features, and the single */}
            {/* AddToCartButton/NotifyWhenAvailable block) — UNCHANGED from today. */}
          </div>
        )}
```

IMPLEMENTER NOTE: In the `!showPicker` branch, paste the EXACT current children of the grid (lines ~233–371 today) unchanged — do not retype them from this plan; copy them from the file so nothing is lost. In the `showPicker` branch above, the price/stock block is intentionally omitted from `children` because `VariantPickerAndCart` renders its own price + stock (it always has, for the multi-variant case). The features/brand/name/category/rating/description are reproduced in `children`. Note the `showPicker` branch no longer needs the separate `ScrollReveal` wrappers (the wrapper renders the grid); this is acceptable — the reveal animation is cosmetic and the content is identical.

- [ ] **Step 5: Type-check + build**

Run: `cd "/Volumes/External5TB/05_Backups/Mac-2026-04-25/Downloads/paws egypt" && npx tsc --noEmit && npm run build`
Expected: PASS / Compiled successfully. Fix any unused-import warnings only if they become errors (e.g. if `ScrollReveal` is now unused in a branch it's still used in the `!showPicker` branch, so it stays imported).

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/(website)/shop/[slug]/page.tsx"
git commit -m "feat(shop): swap product image to selected weight's image on PDP"
```

---

### Task 8: End-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Full build**

Run: `cd "/Volumes/External5TB/05_Backups/Mac-2026-04-25/Downloads/paws egypt" && npm run build`
Expected: Compiled successfully, no type errors.

- [ ] **Step 2: Confirm the live column exists**

Via Supabase MCP `execute_sql` (project `shxnczbvtitnnxyxkkyf`):
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='product_variants' AND column_name='image_url';
```
Expected: returns `image_url`.

- [ ] **Step 3: DB contract check (set + read a variant image), then clean up**

Create a throwaway 2-variant product via SQL, set `image_url` on ONE variant, confirm the PDP query would return it, then delete the test rows. Use a `ZZ-VIMG-` SKU. Mirror the cleanup discipline from prior tasks (delete stock_movements/stock/variants/product). Confirm `products` count returns to its pre-test value.

- [ ] **Step 4: Manual UI check (dev server or preview)**

- Create a product with two weights; give only the larger weight a distinct image. On its PDP, select each weight and confirm the main image swaps for the weight that has an image and falls back to the product image for the one that doesn't.
- Edit an existing product, add an image to one weight, save, reopen → persists.
- A product whose variants have no `image_url` looks identical to before (regression).
- Duplicate a product with a weight image → the copy's matching weight has the image; SKU/product images cleared as before.

- [ ] **Step 5: Done**

All green → feature complete on `feat/variant-images`. PR/merge is a separate user-initiated step.
```
