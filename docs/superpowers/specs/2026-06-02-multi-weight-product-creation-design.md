# Multi-Weight Product Creation — Design

**Date:** 2026-06-02
**Status:** Approved (pending written-spec review)
**Author:** Beyond Tech (PAWS Egypt)

## Problem

Many catalog products are sold in multiple weights (e.g. dog food in 1 kg / 3 kg / 12 kg). Today,
selling the same item in two weights forces one of two clunky workflows:

1. Create **two separate products** ("ALPHA … 4Kg" and "ALPHA … 20Kg") — clutters the shop,
   splits stock and reporting, and duplicates images/descriptions. This is what the live shop
   (`https://pawsegypt.com/en/shop`) shows today (e.g. "Migma Basic Adult 4Kg" / "20Kg",
   "One and Only" in 1KG/3KG/12KG as separate cards).
2. Create one product, save it, then re-open the **Edit** page to add the extra weight as a variant.

The root cause is a **split-brained data model**:

- `product_variants` (`supabase/migrations/0001_initial_schema.sql:97-108`) fully supports multiple
  weights per product: columns `size TEXT`, `weight DECIMAL(10,3)`, `price`, `cost_price`,
  `barcode`, `is_active`.
- The **Edit** page (`src/app/[locale]/(dashboard)/products/[id]/edit/page.tsx`) already has a
  complete, working multi-variant editor and per-variant stock sync.
- The public **product detail page** already renders a weight picker when a product has more than one
  active variant (`VariantPickerAndCart.tsx`).
- BUT the **Add Product** form (`src/app/[locale]/(dashboard)/products/new/page.tsx:359-370`) has a
  single flat price field and hardcodes `size: null, color: null, weight: null` — so it can only ever
  create a single-variant product.

We are closing this gap: the canonical model is **one product with weight variants**, and product
creation must support it.

## Goal

Let a user enter multiple weights (each with its own price, cost, opening stock, and low-stock
threshold) directly on the **Add Product** form, in one save — without re-editing. The single-weight
case must remain exactly as simple as it is today (fill one row).

## Non-Goals (scope guard / YAGNI)

- ❌ No changes to POS, the import scripts (`import-pos-products.ts`, `import-stock.py`), the public
  shop list, or the merge tool.
- ❌ No migration of existing "X 4kg / X 20kg" separate products into single multi-variant products
  (a deliberately separate follow-up).
- ❌ No new "Delete product" button and no multi-warehouse-per-save (separate future quick wins).
- ❌ No database/schema/migration changes — `product_variants` already has every column needed.
- ❌ No name auto-suffix per weight (the storefront already derives a label from the `weight` value).

## Approach — Extract a shared `VariantEditor`, wire it into Add

Chosen over copy-pasting Edit's variant block into Add, because duplication would drift out of sync.
Extraction makes the quick win double as debt paydown (one source of truth; matches the project's
"many small focused files, no duplication" conventions).

### 1. New shared component — `src/components/dashboard/VariantEditor.tsx`

Lift the existing variant UI + helpers out of the Edit page into one self-contained, **controlled**
(presentational) component.

- **Exports:**
  - `interface VariantRow` (moved verbatim from `edit/page.tsx:25-39`): `id: string | null`, `size`,
    `weight`, `color`, `price`, `cost_price`, `barcode`, `is_active`, `stock_row_id`, `quantity`,
    `min_qty`.
  - `function newVariantRow(): VariantRow` (moved verbatim from `edit/page.tsx:41-55`).
  - `function VariantEditor(props): JSX` — renders the variant cards + warehouse selector + the
    "Add variant" button.
- **Props:**
  ```ts
  interface VariantEditorProps {
    variants: VariantRow[];
    onVariantsChange: (next: VariantRow[]) => void;
    warehouses: Array<{ id: string; name: string }>;
    warehouseId: string;
    onWarehouseChange: (id: string) => void;
    isAr: boolean;
  }
  ```
- **Behavior:** owns no persistence. Internally implements `addVariant`, `removeVariant`,
  `updateVariant` against the `variants` prop and calls `onVariantsChange`. The "Remove" button shows
  only when `variants.length > 1`; removing the last row falls back to a single `newVariantRow()`
  (same as Edit today). Removed **saved** variant ids are NOT tracked here — the Edit page keeps its
  own `removedVariantIds` state and derives deletions by diffing (see §3). For Add there are no
  pre-existing ids, so nothing to delete.
- **Markup:** identical structure/classes to `edit/page.tsx:738-883` (size / weight-kg / flavor /
  selling price / cost price / quantity / low-stock / variant barcode), preserving the bilingual
  (en/ar) labels and `paws-*` styling.

### 2. Rework `src/app/[locale]/(dashboard)/products/new/page.tsx`

- **Form shape:** remove the flat `price`, `cost_price`, `initial_qty`, `min_qty` fields from
  `ProductForm`; add `variants: VariantRow[]` (default `[newVariantRow()]`). Keep `warehouse_id` on
  the form. Keep all other product-level fields (sku, names, descriptions, category, brand,
  unit_type, barcode, images, tags, is_active, is_featured).
- **Render:** replace the single Pricing + Stock sections with `<VariantEditor … />`. The product-level
  barcode field stays where it is.
- **Save (`saveProduct`)** — replace the single-variant insert (`:359-370`) and single stock insert
  (`:382-409`) with a loop that mirrors Edit's proven insert path (`edit/page.tsx:369-481`), minus the
  update/delete branches:
  1. `INSERT products` (one row) — unchanged, including the draft → `is_active=false` rule.
  2. Validate every variant row has a numeric `price ≥ 0` and `cost_price ≥ 0` (reuse Edit's
     validation loop `edit/page.tsx:299-314`); on a non-draft save require at least the first row's
     price/cost. Draft save skips price validation (matches current draft leniency).
  3. For each variant row:
     - `INSERT product_variants { product_id, size|null, weight|null, color|null, price, cost_price,
       barcode|null, is_active: asDraft ? false : row.is_active }` and select the new `id`.
     - If `quantity > 0` and a warehouse is selected: `INSERT stock { product_id, variant_id,
       warehouse_id, quantity, min_quantity }`, then `INSERT stock_movements` (type `adjustment`,
       `reference_type: "product_creation"`, `created_by` from `auth.getUser()`), mirroring
       `new/page.tsx:394-407` but with the real `variant_id`.
  4. Error handling: if the product insert fails, abort. If a variant insert fails, surface the error
     (the product already exists — same partial-failure posture as today, which only warned). Stock
     failures remain **non-fatal** warnings (matches `new/page.tsx:389-391`).
  5. Redirect to `/${locale}/products` on success.
- **Duplicate flow (`?duplicate=`)** — upgrade to copy **all** variants of the source (price, cost,
  size, weight, color) into `variants`, instead of only the first variant's price/cost
  (`new/page.tsx:241-253`). Stock is NOT copied (opening stock starts at 0 for the duplicate). SKU and
  images still cleared.

### 3. Slim down `src/app/[locale]/(dashboard)/products/[id]/edit/page.tsx`

- Import `VariantEditor`, `VariantRow`, `newVariantRow` from the new component; delete the now-extracted
  inline `VariantRow`/`newVariantRow` and the inline variant-cards JSX + `addVariant`/`removeVariant`/
  `updateVariant` (the component provides these).
- The Edit **save logic stays exactly as-is** (`edit/page.tsx:285-492`), including `removedVariantIds`
  tracking and per-variant stock delta + `stock_movements`. To keep `removedVariantIds` working with a
  controlled child, Edit's `onVariantsChange` handler diffs the previous vs next arrays: any saved id
  (non-null `id`) present before but absent after is pushed into `removedVariantIds`.
- Net effect: Edit is shorter and behaviorally identical.

## Data Flow (Add, after change)

```
User fills Basic Info + 1..N weight rows (e.g. 4 kg @ 370, 20 kg @ 1400, each with qty)
        │
        ▼
saveProduct(asDraft):
  1. INSERT products (one row)
  2. validate variant prices/costs
  3. for each variant row:
       INSERT product_variants { size, weight, color, price, cost_price, barcode, is_active }
       if qty > 0 and warehouse selected:
         INSERT stock { variant_id, warehouse_id, quantity, min_quantity }
         INSERT stock_movements (audit: product_creation)
  4. redirect → /products
        │
        ▼
Product detail page renders weight picker when >1 active variant   ← already works, no change
```

## Error Handling

- Product insert failure → toast error, abort, no orphan rows.
- Variant insert failure (after product created) → toast error naming the failed variant; product
  remains (recoverable via Edit). Same partial-failure posture as today.
- Stock insert failure → non-fatal warning toast; product + variants are saved.
- Validation (client) → block submit with a clear bilingual toast before any DB write.
- All Supabase errors surfaced via `toast.error(error.message)` (existing pattern).

## Testing Plan

- **Type check:** `npm run build` (the only type gate per `CLAUDE.md`; no test runner exists).
- **Manual via dev server (`npm run dev`):**
  1. Create a product with **two weights** (4 kg @ 370 EGP, 20 kg @ 1400 EGP) + per-weight opening
     stock → verify in DB/UI: one `products` row, two `product_variants`, two `stock` rows, two
     `stock_movements`.
  2. Open that product's detail page → verify the **weight picker** renders with correct per-weight
     prices and stock, and that selecting a weight updates price.
  3. Create a **single-weight** product (one row) → verify it behaves exactly like before (one variant,
     optional single stock row).
  4. **Save as Draft** → product + variants `is_active=false`; not visible on shop.
  5. **Duplicate** an existing multi-variant product → all weights copied, SKU + images cleared, stock 0.
- Confirm the **Edit** page still loads, edits, adds/removes variants, and syncs stock identically
  after the extraction (regression check).

## Risks & Mitigations

- *Risk:* Extraction subtly changes Edit's behavior. *Mitigation:* move code verbatim; keep Edit's save
  loop untouched; regression-test Edit explicitly.
- *Risk:* Partial failure (product saved, a variant fails). *Mitigation:* keep current
  warn-but-don't-roll-back posture; product is editable afterward. (A future hardening could wrap this
  in an RPC/transaction — out of scope here.)
- *Risk:* `removedVariantIds` diffing in Edit. *Mitigation:* diff on every `onVariantsChange`; covered by
  the Edit regression test.
```
