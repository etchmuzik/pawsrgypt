# Per-Weight Variant Images — Design

**Date:** 2026-06-02
**Status:** Approved (pending written-spec review)
**Branch:** new feature branch off `master`

## Problem

A product's images live only on `products.images[]`. Every weight variant (1kg, 5kg, 15kg) of the
same product therefore shows the same photo. In reality different weights often look different — a
1kg pouch vs. a 15kg sack — so each weight should be able to show its own image.

Current `product_variants` columns: `id, product_id, size, color, weight, price, cost_price,
barcode, is_active` — there is **no** image field on variants today (verified against live schema).

## Decisions (confirmed with user)

1. **One optional image per weight**, with fallback to the product's main image (NOT a full
   per-weight gallery). `NULL` ⇒ use the product image. Only weights that actually look different
   need a photo.
2. **Storefront: swap-on-selection.** The PDP opens on the cheapest in-stock weight (unchanged);
   when the shopper selects a different weight, the main image swaps to that weight's image if it
   has one, else stays on the product's main image. (NOT "show all weight images at once.")
3. **Edited inside each weight row, in BOTH Add and Edit.** The per-weight uploader lives in the
   shared `VariantEditor`, so it appears on the Add Product form and the Edit Product page
   automatically.
4. **Apply the migration to the live DB** (via Supabase MCP) as part of this work, then ship code.

## Data model

New nullable column on `product_variants`:

```sql
ALTER TABLE product_variants ADD COLUMN image_url TEXT;  -- nullable; NULL = fall back to product image
```

- Delivered as a **new guarded, idempotent migration** `supabase/migrations/0008_variant_image.sql`
  (same `IF NOT EXISTS` style as `0007`). Applied to the live project `shxnczbvtitnnxyxkkyf`.
- `src/lib/supabase/types.ts`: add `image_url: string | null` to `product_variants` `Row`, and
  (since the hand-maintained `Insert` is `Omit<Row, "id" | "created_at">`) it is automatically part
  of `Insert`/`Update`. No further type edit needed beyond the Row field.
- No backfill: existing variants keep `image_url = NULL` and render exactly as today.

## Component changes

### `src/components/dashboard/VariantEditor.tsx` (shared by Add + Edit)
- `VariantRow` interface gains `image_url: string` (empty string = none). `newVariantRow()` returns
  `image_url: ""`.
- Each variant row renders a compact **single-image** uploader, reusing the existing
  `ImageUploader` component:
  ```tsx
  <ImageUploader
    bucket="product-images"
    folder={`variants/${productId ?? "new"}`}
    images={v.image_url ? [v.image_url] : []}
    onChange={(urls) => updateVariant(idx, { image_url: urls[0] ?? "" })}
    maxImages={1}
  />
  ```
  `ImageUploader` already handles HEIC conversion, compression, and Supabase upload — reused as-is.
- `VariantEditor` gains an optional `productId?: string` prop so the upload folder can be scoped per
  product (Add passes the new product's id once known, or `"new"`; Edit passes `productId`). Since
  Add inserts the product before variants, Add can keep using `"new"` for the folder (images are
  uploaded client-side before save and referenced by URL — folder is only an organizational path,
  not a correctness constraint). Simplest: pass `productId` when available, else omit (folder
  defaults to `variants/new`).

### `src/app/[locale]/(dashboard)/products/new/page.tsx`
- `saveProduct`: include `image_url: v.image_url.trim() || null` in each `product_variants` insert.
- Duplicate loader: copy `image_url` from each source variant into the new rows (a duplicated
  product reasonably reuses the same weight images).

### `src/app/[locale]/(dashboard)/products/[id]/edit/page.tsx`
- Load: map `v.image_url ?? ""` into each `VariantRow` when building rows from DB.
- `handleSubmit`: include `image_url: v.image_url.trim() || null` in the variant insert AND update
  payloads.

### `src/app/[locale]/(website)/shop/[slug]/page.tsx`
- Add `image_url` to the `product_variants(...)` select in `getPdpData`.
- The `VariantOption`/`ProductDetail` types used by the PDP gain `image_url: string | null`.

### `src/components/website/VariantPickerAndCart.tsx`
- The component receives the product's main `imageUrl` (today) plus per-variant `image_url` (already
  in the variants array once the select includes it).
- Compute the displayed image: `const displayedImage = selectedVariant?.image_url ?? imageUrl;`
  and pass `displayedImage` where `imageUrl` is currently passed (line ~204).
- Initial selection is still the cheapest in-stock variant, so the first image shown is that
  variant's image-or-fallback. No change to selection logic.

## Data flow

```
Add/Edit: weight row → ImageUploader(max 1) → VariantRow.image_url → product_variants.image_url
        │
        ▼
PDP getPdpData: variants[] now include image_url
        │
        ▼
VariantPickerAndCart: select "15 kg" → displayedImage = variant.image_url ?? product.images[0]
```

## Non-goals (YAGNI)

- No multi-image gallery per weight (one optional image only).
- No per-weight images on the shop **list** page (cards keep the product main image; no per-weight
  cards). Only the product detail page swaps.
- No POS tile thumbnails (POS stays text + price; possible later nicety).
- No backfill / data migration of existing products.

## Error handling

- Upload failures are surfaced by `ImageUploader`'s existing `toast` handling (unchanged).
- A variant with `image_url = NULL` (or empty) falls back to the product image — never a broken
  image. If the product also has no image, the existing no-image placeholder applies (unchanged).
- DB writes follow the existing non-fatal posture in the save loops.

## Testing

- `npm run build` (type-check gate; repo has no test runner).
- Apply `0008` to the live DB; verify the column exists via Supabase MCP `information_schema`.
- Manual on the Vercel/Hostinger preview:
  1. Create a product with two weights; give only the 15kg one a distinct image. On its PDP,
     confirm selecting 15kg shows that image and selecting 1kg falls back to the product image.
  2. Edit an existing product, add an image to one weight, save, re-open → image persists on that
     variant.
  3. A product whose variants have no `image_url` is visually unchanged (regression).
  4. Duplicate a product with weight images → images carried onto the copy.

## Files touched

| File | Change |
|---|---|
| `supabase/migrations/0008_variant_image.sql` | **New** — add nullable `image_url` to `product_variants` (guarded) |
| `src/lib/supabase/types.ts` | Add `image_url: string \| null` to `product_variants` Row |
| `src/components/dashboard/VariantEditor.tsx` | `VariantRow.image_url` + per-row single `ImageUploader`; optional `productId` prop |
| `src/app/[locale]/(dashboard)/products/new/page.tsx` | Write `image_url` in `saveProduct`; copy in duplicate loader |
| `src/app/[locale]/(dashboard)/products/[id]/edit/page.tsx` | Load `image_url` into rows; write in `handleSubmit` insert+update |
| `src/app/[locale]/(website)/shop/[slug]/page.tsx` | Add `image_url` to PDP variant select + types |
| `src/components/website/VariantPickerAndCart.tsx` | Swap displayed image to `selectedVariant.image_url ?? productImage` |
