import { createClient } from "@/lib/supabase/server";
import { ShopContent, type ProductRow } from "@/components/website/ShopContent";

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: dbProducts } = await supabase
    .from("products")
    .select("id, name_en, name_ar, sku, brand, is_featured, images, categories(name_en, name_ar), product_variants(price)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  const products = dbProducts as ProductRow[] | null;
  const hasDbProducts = products && products.length > 0;

  return <ShopContent products={hasDbProducts ? products : null} />;
}
