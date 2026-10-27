import { createClient as createAnonClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { ShopContent, type ProductRow } from "@/components/website/ShopContent";
import { loadProductsAvailability, summarizeAvailability } from "@/lib/storefront/availability";

type CatalogRow = Omit<ProductRow, "in_stock" | "product_variants"> & {
  product_variants: { id: string; price: number; is_active: boolean }[];
};

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

    const catalog: CatalogRow[] = [];
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name_en, name_ar, sku, brand, is_featured, images, categories(name_en, name_ar), product_variants(id, price, is_active)"
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .order("id")
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error("[shop] Supabase products query failed:", error.message);
        return [];
      }
      catalog.push(...((data as unknown as CatalogRow[] | null) ?? []));
      if ((data?.length ?? 0) < pageSize) break;
    }

    const availability = await loadProductsAvailability(catalog.map((product) => ({
      id: product.id,
      activeVariantIds: product.product_variants.filter((variant) => variant.is_active).map((variant) => variant.id),
    })));
    const products: ProductRow[] = catalog.map((product) => ({
      ...product,
      product_variants: product.product_variants.filter((variant) => variant.is_active).map(({ price }) => ({ price })),
      in_stock: summarizeAvailability(availability.get(product.id) ?? []),
    }));
    // eslint-disable-next-line no-console
    console.log(`[shop] Loaded ${products.length} active products from Supabase`);
    return products;
  },
  ["shop-products-v2-availability"],
  { revalidate: 60, tags: ["shop", "products"] }
);

export default async function ShopPage() {
  const products = await getShopProducts();
  return <ShopContent products={products} />;
}
