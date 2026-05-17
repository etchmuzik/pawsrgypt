import { createClient as createAnonClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { ShopContent, type ProductRow } from "@/components/website/ShopContent";

// Cached: a fresh anon client (no per-request cookies) is created inside so
// the closure stays pure. Product reads are RLS-guarded via the public
// "Read products" policy. Cache is in-memory only — no disk writes (Hostinger).
const getShopProducts = unstable_cache(
  async (): Promise<ProductRow[]> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      // eslint-disable-next-line no-console
      console.error(
        "[shop] Missing Supabase env vars — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Hostinger hPanel.",
        { hasUrl: !!url, hasAnonKey: !!key }
      );
      return [];
    }

    const supabase = createAnonClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name_en, name_ar, sku, brand, is_featured, images, categories(name_en, name_ar), product_variants(price), stock(quantity)"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("[shop] Supabase products query failed:", error.message, error);
      return [];
    }

    const products = (data as unknown as ProductRow[] | null) ?? [];
    // eslint-disable-next-line no-console
    console.log(`[shop] Loaded ${products.length} active products from Supabase`);
    return products;
  },
  ["shop-products-v1"],
  { revalidate: 60, tags: ["shop", "products"] }
);

export default async function ShopPage() {
  const products = await getShopProducts();
  return <ShopContent products={products} />;
}
