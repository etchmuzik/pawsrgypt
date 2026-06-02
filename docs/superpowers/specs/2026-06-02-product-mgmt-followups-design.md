# Product Management Follow-ups — Design

**Date:** 2026-06-02
**Status:** Approved (continues the multi-weight work)
**Branch:** `feat/multi-weight-product-creation`

Three follow-ups to the multi-weight product work, built in dependency order. Each reuses
patterns already proven in the codebase.

---

## Follow-up A — Safe Delete / Archive button on the products list

### Problem
The products list (`ProductsTable.tsx`) has Edit + Duplicate per row, but **no delete/archive**.
The only ways to hide a product today are the `is_active` toggle buried in Edit, or Merge.
Staff need a one-click, safe "archive" on each row.

### Decision
**Soft-archive only** — set `products.is_active = false` (+ deactivate its variants so the PDP
picker doesn't show stale options). NO hard delete: products are referenced by `invoice_items`
and `purchase_items`; deleting would orphan sales/purchase history. This matches the existing
`mergeProducts` posture (deactivate, never delete).

### Design
- **New server action** in `src/app/[locale]/(dashboard)/products/[id]/actions.ts`:
  `setProductActive(productId: string, active: boolean): Promise<{ ok: boolean; error?: string }>`.
  - Gated by the existing `requireManager()` (admin/manager only).
  - Uses `createAdminClient()` (consistent with `mergeProducts`; cashier RLS would block).
  - Updates `products.is_active = active`, and sets `product_variants.is_active = active` for that
    product (so an archived product has no active variants on the storefront; reactivating restores them).
  - `revalidatePath` the products page + `revalidateTag("shop")` / `("products")` (same as merge).
- **UI** — `ProductsTable.tsx` gains an Archive/Restore action per row:
  - A `<ProductRowActions>` client piece (or inline) with an Archive button (`Archive` icon from
    lucide) for active products, Restore (`ArchiveRestore`) for inactive ones.
  - Clicking opens a confirm dialog (shadcn `AlertDialog`) — "Archive <name>? It will be hidden from
    the shop. Sales history is preserved. You can restore it later." Bilingual.
  - On confirm, call the action; on success `router.refresh()` and toast.
- The list already shows an Active/Inactive badge — the button label follows that state.

### Non-goals
No hard delete. No bulk archive. No cascade to stock rows (stock is preserved; archived products
just aren't visible/sellable).

---

## Follow-up B — Migration tool: consolidate split-weight products into one

### Problem
The live catalog has the same item as separate products per weight ("ALPHA … 4Kg", "ALPHA … 20Kg").
We want to fold those into ONE product carrying weight variants — using the model the rest of the app
now supports.

### Decision
Extend the existing **merge** machinery. `mergeProducts` already moves variants/stock/invoice_items/
purchase_items/stock_movements from source → target and deactivates the source. The only thing it
lacks for this use case: when a source product's single variant moves into the target, that variant
should be **labelled with its weight** so the target's picker can distinguish "4kg" vs "20kg".

### Design
- **New server action** `mergeWithWeights(targetProductId, items)` in the same `actions.ts`, where
  `items: Array<{ sourceProductId: string; weightKg: number | null; sizeLabel: string | null }>`.
  - Gated by `requireManager()`, uses `createAdminClient()`.
  - For each item: BEFORE moving, stamp the source product's variants with the provided
    `weight`/`size` (so when they land on the target they carry the right label), then run the same
    five moves as `mergeProducts` (variants, stock, invoice_items, purchase_items, stock_movements →
    target), then deactivate the source. Reuse the existing move logic (extract a private
    `moveProductChildren(sourceId, targetId)` helper from `mergeProducts` so both call it — DRY).
  - Also stamp the TARGET's own existing variant(s) with the target's weight if provided
    (so the product that becomes the "base" also gets a weight label).
  - Return counts + any per-source error.
- **UI** — a new dialog `ConsolidateWeightsDialog.tsx`, reachable from the products list (a new
  "Consolidate weights" action, manager-only) and/or from the Edit page next to "Merge".
  - User picks a target (the product that will remain) and adds one or more source products, each with
    a weight (kg) / size label. A preview (reusing the `previewMerge` count pattern) shows how many
    variants/stock/history rows will move per source.
  - On confirm → `mergeWithWeights`, then refresh + toast, navigate to the target's Edit page so the
    user can sanity-check the consolidated variants.

### Safety / non-goals
- Reuses the proven, reversible-by-reactivation merge approach (sources are deactivated, not deleted —
  history preserved; a mistaken consolidation can be unwound by reactivating the source and moving
  variants back, same as merge today).
- No automatic name-parsing of weights from product names (manual weight entry per source — explicit
  and safe; auto-parse could mis-read "1.5kg"/"400g"). Auto-detect is a possible later enhancement.
- No bulk/auto consolidation across the whole catalog — one target + its sources per operation.

---

## Follow-up C — Variant-aware POS + variant-aware checkout

### Problem
POS (`pos/page.tsx`) is variant-blind: it reads only `product_variants[0].price`, sums all stock,
keys the cart on `product.id`, writes `invoice_items` with `product_id` only (no `variant_id`), and
**does not decrement stock at all** on checkout. A multi-weight product can't be sold by the right
weight, and inventory never updates.

### Decisions (confirmed with user)
1. **One tile per weight variant** at the register (not a per-product picker).
2. **Yes, decrement stock on sale** (fix the missing-inventory bug as part of this).

### Design
- **Query** — load active products WITH their active variants and per-variant stock:
  `select id, name_en, sku, product_variants(id, price, size, weight, color, is_active, barcode), stock(quantity, variant_id)`,
  `is_active = true`. Build one `POSProduct` per **active variant**:
  - `id` = variant id (the cart now keys on variant), `productId` = product id, `name` =
    `name_en` + variant label (size, else `"<weight> kg"`, else plain), `price` = variant price,
    `barcode` = variant barcode, `stock` = sum of stock rows for that `variant_id` (legacy single-variant
    products with `variant_id = null` stock fall back to the null-variant total).
  - A product with one no-label variant renders as a single tile (unchanged UX for simple products).
- **Search** also matches variant barcode (enables barcode scanning per weight).
- **Cart** keys on `variantId`; `CartItem` gains `variantId` and `productId`.
- **Checkout** (`handleCheckout`):
  - `invoice_items` rows now include `variant_id`.
  - After items insert, for each cart line **decrement stock and record a movement**:
    - Find the stock row for `(product_id, variant_id)` at the sale warehouse (POS uses the default/first
      active warehouse — load it on mount, same as the product forms). Reduce `quantity` by the sold qty
      (floor at 0), `update` the stock row.
    - Insert a `stock_movements` row: `type: 'sale'`, `product_id`, `variant_id`, `quantity`,
      `from_warehouse_id`, `reference_type: 'pos_sale'`, `reference_id: invoice.id`, `created_by`.
    - Stock decrement failure is **non-fatal** to the sale (the invoice + payment already succeeded —
      warn but don't void the sale), matching the codebase's product-form posture. Movements are
      best-effort audit.
  - Demo-fallback products keep working (they have no real ids → skip stock decrement when the id isn't a UUID / has no matching stock row).
- **VAT** stays 14% (unchanged; out of scope).

### Import scripts (the smaller half of C)
The import scripts (`scripts/import-pos-products.ts`, `scripts/import-stock.py`) currently always set
`weight = null`. Scope for this pass: **document** that weight is not imported and leave a clearly
marked extension point, OR add optional weight handling IF the source spreadsheets carry a weight
column. Since the POS export columns (per CLAUDE.md) do NOT include a weight column (الوحدة = species,
not unit), there is no weight data to import today. **Decision:** leave the importers as-is and note
this explicitly; the manual VariantEditor (Add/Edit) + the consolidation tool (B) are the supported
paths to multi-weight products. (Revisit importer weight support only if a future export includes a
weight column.)

### Non-goals
No change to VAT, no multi-warehouse selection at POS (uses default warehouse), no offline mode,
no importer weight parsing (no source data for it).

---

## Cross-cutting

- **Testing:** no test runner; gate is `npm run build` (type-check) + manual verification on the Vercel
  preview, plus DB-contract checks via Supabase MCP (project `shxnczbvtitnnxyxkkyf`) with cleanup.
- **Auth:** A and B use `requireManager()`; POS is already behind the `/pos` protected path.
- **Pattern reuse:** A and B live in the existing `products/[id]/actions.ts`; B extracts a shared
  `moveProductChildren` helper from `mergeProducts`. C edits `pos/page.tsx` only (plus a tiny shared
  variant-label helper if useful).
- **i18n:** all new user-facing strings bilingual (en/ar), matching existing inline `L` patterns.

---

## Build notes (what actually shipped)

All three follow-ups were implemented on branch `feat/multi-weight-product-creation`, each
two-stage reviewed (spec + code quality) and verified end-to-end against the live Supabase DB
(test data cleaned up afterward; counts returned to the 391/395 baseline).

- **A — Archive/Restore:** `setProductActive` server action + per-row Archive/Restore confirm
  dialog in `ProductsTable.tsx`. Verified: archived product → `is_active=false`, 0 active
  variants, hidden from shop, history preserved.
- **B — Consolidate weights:** extracted shared `moveProductChildren` from `mergeProducts`;
  added `mergeWithWeights` action + `ConsolidateWeightsDialog` + `ConsolidateWeightsButton`.
  Verified: two split products (1kg target + separate 5kg) folded into one product with 2 active
  weight variants; source deactivated. Partial-progress count surfaced on mid-failure.
- **C — Variant-aware POS + stock:** one tile per active weight variant, variant-keyed cart,
  `invoice_items.variant_id`, and stock decrement + `out` movement moved to a server route
  `/api/pos-sale` (admin client) — needed because `stock_movements` RLS excludes `cashier`. The
  route falls back to legacy null-variant stock rows and verifies the invoice exists first.

### Unplanned fix discovered during verification (important)
Verifying C against the LIVE DB exposed that the `invoices` table had drifted from the repo
migrations: `tax` is a GENERATED column (must write `tax_amount`), and `branch_id` + `created_by`
are NOT NULL with no default. The pre-existing POS `handleCheckout` inserted `tax` and omitted
`branch_id`/`created_by`, so **every POS sale was failing at the invoice insert** before any of
this work. Fixed in `pos/page.tsx`: load the cashier's `userId` + `branch_id` (profile →
first-branch fallback) on mount; insert `tax_amount`/`branch_id`/`created_by` on the invoice and
`created_by` on the payment; guard against missing branch/user. The repo migrations remain stale
vs. the live schema — see the `db-schema-drift-invoices` project memory.
