import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Upload, Pencil, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
}

interface ProductWithVariant {
  id: string;
  sku: string;
  name_en: string;
  name_ar: string;
  brand: string | null;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  categories: { name_en: string } | null;
  product_variants: { price: number; cost_price: number }[];
}

async function getProducts(): Promise<ProductWithVariant[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, sku, name_en, name_ar, brand, images, is_active, is_featured, created_at, categories(name_en), product_variants(price, cost_price)")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as ProductWithVariant[] | null) ?? [];
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
          <Button variant="outline" size="sm" className="gap-1.5 border-paws-sand">
            <Upload className="w-4 h-4" /> Import
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 border-paws-sand">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Link href={`/${locale}/products/new`}>
            <Button size="sm" className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white">
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search products by name, SKU, barcode..." className="ps-9 bg-white border-paws-sand max-w-sm" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-paws-sand overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paws-sand bg-paws-cream/50">
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">Image</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">Product</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">SKU</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">Category</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">Price</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">Cost</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">Status</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-paws-cream flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-paws-brown/40" />
                      </div>
                      <div>
                        <p className="font-medium text-paws-brown-dark">No products yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Add your first product to get started.</p>
                      </div>
                      <Link href={`/${locale}/products/new`}>
                        <Button size="sm" className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white mt-2">
                          <Plus className="w-4 h-4" /> Add Product
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const price = product.product_variants?.[0]?.price;
                  const cost = product.product_variants?.[0]?.cost_price;
                  const imageUrl = product.images?.[0];
                  const categoryName = product.categories?.name_en;

                  return (
                    <tr key={product.id} className="border-b border-paws-sand/50 hover:bg-paws-cream/30 transition-colors">
                      {/* Image */}
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-100 overflow-hidden flex items-center justify-center">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={product.name_en}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-neutral-300" />
                          )}
                        </div>
                      </td>

                      {/* Product name */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-paws-brown-dark">{product.name_en}</p>
                          {product.name_ar && (
                            <p className="text-xs text-muted-foreground mt-0.5" dir="rtl">{product.name_ar}</p>
                          )}
                          {product.brand && (
                            <p className="text-xs text-paws-orange/70 mt-0.5">{product.brand}</p>
                          )}
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{product.sku}</td>

                      {/* Category */}
                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {categoryName ?? "—"}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3">
                        {price != null ? (
                          <span className="font-semibold text-paws-brown-dark">
                            {price.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">EGP</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-3">
                        {cost != null ? (
                          <span className="text-muted-foreground text-sm">
                            {cost.toLocaleString()} EGP
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={product.is_active ? "default" : "secondary"}
                            className={product.is_active ? "bg-green-100 text-green-700 hover:bg-green-100 w-fit" : "w-fit"}
                          >
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {product.is_featured && (
                            <Badge className="bg-paws-orange/10 text-paws-orange hover:bg-paws-orange/10 w-fit text-[10px]">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <Link href={`/${locale}/products/${product.id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-paws-orange hover:text-paws-orange/80 hover:bg-paws-orange/5">
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
