import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type StockBalance = { variant_id: string | null; quantity: number };

// Only 0/1 availability leaves the server. Warehouse balances remain private.
export function publicAvailability(
  rows: StockBalance[],
  activeVariantIds: string[],
): StockBalance[] {
  const balances = new Map<string | null, number>();
  for (const row of rows) {
    const quantity = Number(row.quantity);
    if (!Number.isFinite(quantity)) continue;
    balances.set(
      row.variant_id,
      (balances.get(row.variant_id) ?? 0) + quantity,
    );
  }
  return activeVariantIds.map((id) => ({
    variant_id: id,
    quantity:
      (balances.get(id) ??
        (activeVariantIds.length === 1 ? (balances.get(null) ?? 0) : 0)) > 0
        ? 1
        : 0,
  }));
}

export async function loadProductAvailability(
  productId: string,
  activeVariantIds: string[],
) {
  try {
    const { data, error } = await createAdminClient()
      .from("stock")
      .select("quantity, variant_id")
      .eq("product_id", productId);
    if (error) throw new Error("Stock lookup failed");
    return publicAvailability(data ?? [], activeVariantIds);
  } catch {
    console.error("[pdp] Product availability lookup failed", { productId });
    return publicAvailability([], activeVariantIds);
  }
}
