import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import Link from "next/link";
import { ProductsTable, type ProductRow } from "@/components/dashboard/ProductsTable";

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
}

async function getProducts(): Promise<ProductRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, sku, name_en, name_ar, brand, images, is_active, is_featured, created_at, categories(name_en), product_variants(price, cost_price)")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data as ProductRow[] | null) ?? [];
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { locale } = await params;
  const products = await getProducts();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-paws-brown-dark">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} product{products.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/products/import`}>
            <Button variant="outline" size="sm" className="gap-1.5 border-paws-sand">
              <Upload className="w-4 h-4" /> Import
            </Button>
          </Link>
          <Link href={`/${locale}/products/new`}>
            <Button size="sm" className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white">
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      <ProductsTable products={products} locale={locale} />
    </div>
  );
}
