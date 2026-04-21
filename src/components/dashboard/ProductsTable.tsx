"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Pencil, Copy, Image as ImageIcon, Plus } from "lucide-react";

export interface ProductRow {
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

interface ProductsTableProps {
  products: ProductRow[];
  locale: string;
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(rows: ProductRow[]): string {
  const headers = [
    "sku",
    "name_en",
    "name_ar",
    "brand",
    "category",
    "price",
    "cost_price",
    "is_active",
    "is_featured",
    "created_at",
  ];
  const lines = [headers.join(",")];
  for (const row of rows) {
    const variant = row.product_variants?.[0];
    lines.push(
      [
        row.sku,
        row.name_en,
        row.name_ar,
        row.brand ?? "",
        row.categories?.name_en ?? "",
        variant?.price ?? "",
        variant?.cost_price ?? "",
        row.is_active ? "yes" : "no",
        row.is_featured ? "yes" : "no",
        row.created_at,
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return lines.join("\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ProductsTable({ products, locale }: ProductsTableProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((p) => {
      const haystack = [
        p.sku,
        p.name_en,
        p.name_ar,
        p.brand ?? "",
        p.categories?.name_en ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [products, query]);

  const handleExport = () => {
    if (filtered.length === 0) return;
    const csv = buildCsv(filtered);
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `products-${date}.csv`);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products by name, SKU, brand, category..."
            className="ps-9 bg-white border-paws-sand"
          />
        </div>
        <div className="flex items-center gap-2">
          {query && (
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {products.length}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="gap-1.5 border-paws-sand"
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-paws-cream flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-paws-brown/40" />
                      </div>
                      <div>
                        <p className="font-medium text-paws-brown-dark">
                          {query ? "No matches" : "No products yet"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {query
                            ? "Try a different search term."
                            : "Add your first product to get started."}
                        </p>
                      </div>
                      {!query && (
                        <Link href={`/${locale}/products/new`}>
                          <Button size="sm" className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white mt-2">
                            <Plus className="w-4 h-4" /> Add Product
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const price = product.product_variants?.[0]?.price;
                  const cost = product.product_variants?.[0]?.cost_price;
                  const imageUrl = product.images?.[0];
                  const categoryName = product.categories?.name_en;

                  return (
                    <tr key={product.id} className="border-b border-paws-sand/50 hover:bg-paws-cream/30 transition-colors">
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

                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{product.sku}</td>

                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {categoryName ?? "—"}
                      </td>

                      <td className="px-4 py-3">
                        {price != null ? (
                          <span className="font-semibold text-paws-brown-dark">
                            {price.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">EGP</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {cost != null ? (
                          <span className="text-muted-foreground text-sm">
                            {cost.toLocaleString()} EGP
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

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

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/${locale}/products/${product.id}/edit`}>
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-paws-orange hover:text-paws-orange/80 hover:bg-paws-orange/5">
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </Button>
                          </Link>
                          <Link href={`/${locale}/products/new?duplicate=${product.id}`} title="Duplicate product">
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-paws-brown hover:text-paws-brown/80 hover:bg-paws-cream/50">
                              <Copy className="w-3.5 h-3.5" />
                              Duplicate
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
