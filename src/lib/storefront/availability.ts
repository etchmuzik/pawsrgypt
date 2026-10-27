import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type StockBalance = { variant_id: string | null; quantity: number };
type PublicBalance = { variant_id: string; quantity: 0 | 1 | null };
type AvailabilityProduct = { id: string; activeVariantIds: string[] };

// null means inventory is untracked, not sold out. Only availability leaves
// the server; warehouse balances remain private.
export function publicAvailability(
  rows: StockBalance[],
  activeVariantIds: string[],
): PublicBalance[] {
  const balances = new Map<string | null, number>();
  for (const row of rows) {
    const quantity = Number(row.quantity);
    if (!Number.isFinite(quantity)) continue;
    balances.set(
      row.variant_id,
      (balances.get(row.variant_id) ?? 0) + quantity,
    );
  }
  return activeVariantIds.map((id) => {
    const quantity = balances.get(id) ??
      (activeVariantIds.length === 1 ? balances.get(null) : undefined);
    return { variant_id: id, quantity: quantity === undefined ? null : quantity > 0 ? 1 : 0 };
  });
}

export function summarizeAvailability(rows: PublicBalance[]): boolean | null {
  if (rows.some((row) => row.quantity === 1)) return true;
  if (rows.some((row) => row.quantity === null)) return null;
  return false;
}

export function publicCatalogAvailability(
  rows: (StockBalance & { product_id: string })[],
  products: AvailabilityProduct[],
): Map<string, PublicBalance[]> {
  const byProduct = new Map<string, StockBalance[]>();
  for (const row of rows) {
    const balances = byProduct.get(row.product_id) ?? [];
    balances.push(row);
    byProduct.set(row.product_id, balances);
  }
  return new Map(products.map((product) => [
    product.id,
    publicAvailability(byProduct.get(product.id) ?? [], product.activeVariantIds),
  ]));
}

export async function loadProductsAvailability(products: AvailabilityProduct[]) {
  if (!products.length) return new Map<string, PublicBalance[]>();
  const client = createAdminClient();
  const pageSize = 500;
  // Bound each filter URL and page all warehouse rows before aggregating.
  const batches: AvailabilityProduct[][] = [];
  for (let offset = 0; offset < products.length; offset += 100) {
    batches.push(products.slice(offset, offset + 100));
  }
  const results = await Promise.all(batches.map(async (batch) => {
    const rows: (StockBalance & { product_id: string })[] = [];
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await client
        .from("stock")
        .select("product_id, quantity, variant_id")
        .in("product_id", batch.map((product) => product.id))
        .order("id")
        .range(offset, offset + pageSize - 1);
      if (error) throw new Error("Stock lookup failed");
      rows.push(...(data ?? []));
      if ((data?.length ?? 0) < pageSize) break;
    }
    return rows;
  }));
  return publicCatalogAvailability(results.flat(), products);
}

export async function loadProductAvailability(
  productId: string,
  activeVariantIds: string[],
) {
  const availability = await loadProductsAvailability([{ id: productId, activeVariantIds }]);
  return availability.get(productId) ?? [];
}
