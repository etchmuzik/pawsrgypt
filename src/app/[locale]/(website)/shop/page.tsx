import { createClient } from "@/lib/supabase/server";
import { ShopContent, type ProductRow } from "@/components/website/ShopContent";

// Re-render at most once per minute. Dashboard edits become visible on the
// storefront within 60s; the merge action revalidates explicitly for instant
// reflection of bigger changes.
export const revalidate = 60;

export default async function ShopPage() {
  // Surface misconfiguration loud and early — Hostinger Node logs will capture
  // this and reveal missing/invalid Supabase env vars.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // eslint-disable-next-line no-console
    console.error(
      "[shop] Missing Supabase env vars — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Hostinger hPanel.",
      {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    );
  }

  const supabase = await createClient();
  const { data: dbProducts, error } = await supabase
    .from("products")
    .select(
      "id, name_en, name_ar, sku, brand, is_featured, images, categories(name_en, name_ar), product_variants(price), stock(quantity)",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[shop] Supabase products query failed:", error.message, error);
  }

  const products = (dbProducts as ProductRow[] | null) ?? [];
  // eslint-disable-next-line no-console
  console.log(`[shop] Loaded ${products.length} active products from Supabase`);

  return <ShopContent products={products} />;
}
