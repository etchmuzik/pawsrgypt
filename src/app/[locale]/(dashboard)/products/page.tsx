import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Upload } from "lucide-react";
import type { Product } from "@/lib/supabase/types";

async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, categories(name_en)")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as Product[]) ?? [];
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-paws-brown-dark">Products</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 border-paws-sand">
            <Upload className="w-4 h-4" /> Import
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 border-paws-sand">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button size="sm" className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white">
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search products by name, SKU, barcode..." className="ps-9 bg-white border-paws-sand max-w-sm" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-paws-sand overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-paws-sand bg-paws-cream/50">
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">SKU</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Name</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Category</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Brand</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Status</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No products yet. Add your first product.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-b border-paws-sand/50 hover:bg-paws-cream/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{product.sku}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-paws-brown-dark">{product.name_en}</p>
                      <p className="text-xs text-muted-foreground">{product.name_ar}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">—</td>
                  <td className="px-4 py-3 text-muted-foreground">{product.brand ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={product.is_active ? "default" : "secondary"}
                      className={product.is_active ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs">Edit</Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">Barcode</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
