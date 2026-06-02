"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface MergeResult {
  ok: boolean;
  error?: string;
  targetId?: string;
  moved?: {
    variants: number;
    stockRows: number;
    invoiceItems: number;
    purchaseItems: number;
    stockMovements: number;
  };
}

export interface MergePreview {
  ok: boolean;
  error?: string;
  source?: { id: string; name_en: string; sku: string };
  target?: { id: string; name_en: string; sku: string };
  counts?: {
    variants: number;
    stockRows: number;
    invoiceItems: number;
    purchaseItems: number;
    stockMovements: number;
  };
}

async function requireManager(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { ok: false, error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  const role = (profile as { role: string } | null)?.role;
  if (role !== "admin" && role !== "manager") {
    return { ok: false, error: "Only admins or managers can perform this action." };
  }
  return { ok: true };
}

type MovedCounts = {
  variants: number;
  stockRows: number;
  invoiceItems: number;
  purchaseItems: number;
  stockMovements: number;
};

/**
 * Reassign all child rows (variants, stock, invoice_items, purchase_items,
 * stock_movements) of `sourceProductId` to `targetProductId`. Caller must have
 * already passed requireManager() and constructed `admin`.
 * Returns moved counts or an error string.
 */
async function moveProductChildren(
  admin: ReturnType<typeof createAdminClient>,
  sourceProductId: string,
  targetProductId: string
): Promise<{ ok: true; moved: MovedCounts } | { ok: false; error: string }> {
  const moved: MovedCounts = { variants: 0, stockRows: 0, invoiceItems: 0, purchaseItems: 0, stockMovements: 0 };

  const variantsRes = await admin
    .from("product_variants")
    .update({ product_id: targetProductId } as never)
    .eq("product_id", sourceProductId)
    .select("id");
  if (variantsRes.error) return { ok: false, error: `Variants: ${variantsRes.error.message}` };
  moved.variants = variantsRes.data?.length ?? 0;

  const stockRes = await admin
    .from("stock")
    .update({ product_id: targetProductId } as never)
    .eq("product_id", sourceProductId)
    .select("id");
  if (stockRes.error) return { ok: false, error: `Stock: ${stockRes.error.message}` };
  moved.stockRows = stockRes.data?.length ?? 0;

  const invRes = await admin
    .from("invoice_items")
    .update({ product_id: targetProductId } as never)
    .eq("product_id", sourceProductId)
    .select("id");
  if (invRes.error) return { ok: false, error: `Invoice items: ${invRes.error.message}` };
  moved.invoiceItems = invRes.data?.length ?? 0;

  const poRes = await admin
    .from("purchase_items")
    .update({ product_id: targetProductId } as never)
    .eq("product_id", sourceProductId)
    .select("id");
  if (poRes.error) return { ok: false, error: `Purchase items: ${poRes.error.message}` };
  moved.purchaseItems = poRes.data?.length ?? 0;

  const movRes = await admin
    .from("stock_movements")
    .update({ product_id: targetProductId } as never)
    .eq("product_id", sourceProductId)
    .select("id");
  if (movRes.error) return { ok: false, error: `Stock movements: ${movRes.error.message}` };
  moved.stockMovements = movRes.data?.length ?? 0;

  return { ok: true, moved };
}

export async function previewMerge(
  targetProductId: string,
  sourceProductId: string
): Promise<MergePreview> {
  if (!targetProductId || !sourceProductId) {
    return { ok: false, error: "Missing product ids." };
  }
  if (targetProductId === sourceProductId) {
    return { ok: false, error: "Cannot merge a product into itself." };
  }

  const guard = await requireManager();
  if (!guard.ok) return { ok: false, error: guard.error };

  const admin = createAdminClient();

  type ProductLite = { id: string; name_en: string; sku: string };

  const [sourceRes, targetRes] = await Promise.all([
    admin.from("products").select("id, name_en, sku").eq("id", sourceProductId).single(),
    admin.from("products").select("id, name_en, sku").eq("id", targetProductId).single(),
  ]);

  const source = sourceRes.data as ProductLite | null;
  const target = targetRes.data as ProductLite | null;
  if (!source) return { ok: false, error: "Source not found." };
  if (!target) return { ok: false, error: "Target not found." };

  // Count rows that will move.
  const counts = await Promise.all([
    admin.from("product_variants").select("id", { count: "exact", head: true }).eq("product_id", sourceProductId),
    admin.from("stock").select("id", { count: "exact", head: true }).eq("product_id", sourceProductId),
    admin.from("invoice_items").select("id", { count: "exact", head: true }).eq("product_id", sourceProductId),
    admin.from("purchase_items").select("id", { count: "exact", head: true }).eq("product_id", sourceProductId),
    admin.from("stock_movements").select("id", { count: "exact", head: true }).eq("product_id", sourceProductId),
  ]);

  return {
    ok: true,
    source,
    target,
    counts: {
      variants: counts[0].count ?? 0,
      stockRows: counts[1].count ?? 0,
      invoiceItems: counts[2].count ?? 0,
      purchaseItems: counts[3].count ?? 0,
      stockMovements: counts[4].count ?? 0,
    },
  };
}

/**
 * Merge `sourceProductId` into `targetProductId`:
 * - Move all variants, stock, invoice_items, purchase_items, stock_movements
 *   from source → target by reassigning product_id.
 * - Mark source as inactive (preserve audit trail; don't delete).
 *
 * Uses the admin client because cross-table updates would otherwise be blocked
 * by RLS for cashier role and complicate the operation.
 */
export async function mergeProducts(
  targetProductId: string,
  sourceProductId: string
): Promise<MergeResult> {
  if (!targetProductId || !sourceProductId) {
    return { ok: false, error: "Missing product ids." };
  }
  if (targetProductId === sourceProductId) {
    return { ok: false, error: "Cannot merge a product into itself." };
  }

  const guard = await requireManager();
  if (!guard.ok) return { ok: false, error: guard.error };

  const admin = createAdminClient();

  // Sanity: both must exist.
  const [{ data: source }, { data: target }] = await Promise.all([
    admin.from("products").select("id").eq("id", sourceProductId).single(),
    admin.from("products").select("id").eq("id", targetProductId).single(),
  ]);
  if (!source) return { ok: false, error: "Source product not found." };
  if (!target) return { ok: false, error: "Target product not found." };

  // 1-5. Move all child rows (variants, stock, invoice_items, purchase_items,
  // stock_movements) from source → target via the shared helper.
  const moveRes = await moveProductChildren(admin, sourceProductId, targetProductId);
  if (!moveRes.ok) return { ok: false, error: moveRes.error };
  const moved = moveRes.moved;

  // 6. Deactivate source product (preserve audit trail, don't delete).
  const deactivateRes = await admin
    .from("products")
    .update({ is_active: false } as never)
    .eq("id", sourceProductId);
  if (deactivateRes.error) {
    return { ok: false, error: `Deactivate source: ${deactivateRes.error.message}` };
  }

  revalidatePath("/[locale]/(dashboard)/products", "page");
  revalidatePath(`/[locale]/(dashboard)/products/${targetProductId}/edit`, "page");
  revalidatePath("/[locale]/(website)/shop", "page");
  // Invalidate the unstable_cache entries on the storefront so the merge is
  // visible immediately instead of waiting up to 60s.
  revalidateTag("shop");
  revalidateTag("products");

  return { ok: true, targetId: targetProductId, moved };
}

export interface SetActiveResult {
  ok: boolean;
  error?: string;
}

/**
 * Archive (is_active=false) or restore (is_active=true) a product.
 * Soft only — never deletes, so invoice_items/purchase_items history is preserved.
 * Also flips the product's variants to match, so an archived product exposes no
 * active variants on the storefront (and restoring brings them back).
 */
export async function setProductActive(
  productId: string,
  active: boolean
): Promise<SetActiveResult> {
  if (!productId) return { ok: false, error: "Missing product id." };

  const guard = await requireManager();
  if (!guard.ok) return { ok: false, error: guard.error };

  const admin = createAdminClient();

  const productRes = await admin
    .from("products")
    .update({ is_active: active } as never)
    .eq("id", productId);
  if (productRes.error) return { ok: false, error: productRes.error.message };

  // Keep variants in sync so the storefront picker / shop visibility is consistent.
  const variantsRes = await admin
    .from("product_variants")
    .update({ is_active: active } as never)
    .eq("product_id", productId);
  if (variantsRes.error) return { ok: false, error: variantsRes.error.message };

  revalidatePath("/[locale]/(dashboard)/products", "page");
  revalidatePath("/[locale]/(website)/shop", "page");
  revalidateTag("shop");
  revalidateTag("products");

  return { ok: true };
}

export interface ConsolidateItem {
  sourceProductId: string;
  weightKg: number | null;
  sizeLabel: string | null;
}

export interface ConsolidateResult {
  ok: boolean;
  error?: string;
  targetId?: string;
  consolidated?: number; // number of source products folded in
}

/**
 * Consolidate one or more split-weight source products into a single target
 * product, labelling each merged product's variants with the given weight/size
 * so the target ends up with distinct weight variants.
 *
 * For the target itself, optionally pass a matching item (sourceProductId ===
 * targetProductId) to label the target's own existing variants too.
 *
 * Sources are deactivated (not deleted) — history preserved, reversible.
 */
export async function mergeWithWeights(
  targetProductId: string,
  items: ConsolidateItem[]
): Promise<ConsolidateResult> {
  if (!targetProductId) return { ok: false, error: "Missing target product id." };
  if (!items || items.length === 0) return { ok: false, error: "No source products selected." };

  const guard = await requireManager();
  if (!guard.ok) return { ok: false, error: guard.error };

  const admin = createAdminClient();

  // Target must exist.
  const { data: target } = await admin
    .from("products")
    .select("id")
    .eq("id", targetProductId)
    .single();
  if (!target) return { ok: false, error: "Target product not found." };

  let consolidated = 0;

  for (const item of items) {
    const { sourceProductId, weightKg, sizeLabel } = item;
    if (!sourceProductId) continue;

    // Stamp this product's CURRENT variants with the weight/size label so they
    // carry the right label when they land on the target.
    const labelPatch: Record<string, unknown> = {};
    if (weightKg != null && !Number.isNaN(weightKg)) labelPatch.weight = weightKg;
    if (sizeLabel && sizeLabel.trim()) labelPatch.size = sizeLabel.trim();
    if (Object.keys(labelPatch).length > 0) {
      const labelRes = await admin
        .from("product_variants")
        .update(labelPatch as never)
        .eq("product_id", sourceProductId);
      if (labelRes.error) {
        return { ok: false, error: `Labelling ${sourceProductId}: ${labelRes.error.message}`, consolidated };
      }
    }

    // If this item refers to the target itself, we only relabel — no move/deactivate.
    if (sourceProductId === targetProductId) continue;

    const moveRes = await moveProductChildren(admin, sourceProductId, targetProductId);
    if (!moveRes.ok) return { ok: false, error: moveRes.error, consolidated };

    const deactivateRes = await admin
      .from("products")
      .update({ is_active: false } as never)
      .eq("id", sourceProductId);
    if (deactivateRes.error) {
      return { ok: false, error: `Deactivate ${sourceProductId}: ${deactivateRes.error.message}`, consolidated };
    }
    consolidated += 1;
  }

  revalidatePath("/[locale]/(dashboard)/products", "page");
  revalidatePath(`/[locale]/(dashboard)/products/${targetProductId}/edit`, "page");
  revalidatePath("/[locale]/(website)/shop", "page");
  revalidateTag("shop");
  revalidateTag("products");

  return { ok: true, targetId: targetProductId, consolidated };
}
