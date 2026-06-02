"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Pencil, Copy, Image as ImageIcon, Plus, Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setProductActive } from "@/app/[locale]/(dashboard)/products/[id]/actions";

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
  const router = useRouter();
  const [confirmTarget, setConfirmTarget] = useState<ProductRow | null>(null);
  const [working, setWorking] = useState(false);
  const uiLocale = useLocale();
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");
  const L = {
    searchPlaceholder: uiLocale === "ar" ? "دور بالاسم أو الكود أو البراند أو الفئة..." : "Search products by name, SKU, brand, category...",
    exportCsv: uiLocale === "ar" ? "تصدير CSV" : "Export CSV",
    image: uiLocale === "ar" ? "الصورة" : "Image",
    productCol: uiLocale === "ar" ? "المنتج" : "Product",
    categoryCol: uiLocale === "ar" ? "الفئة" : "Category",
    priceCol: uiLocale === "ar" ? "السعر" : "Price",
    costCol: uiLocale === "ar" ? "التكلفة" : "Cost",
    statusCol: uiLocale === "ar" ? "الحالة" : "Status",
    actionsCol: uiLocale === "ar" ? "إجراءات" : "Actions",
    noMatches: uiLocale === "ar" ? "مفيش نتائج" : "No matches",
    differentSearch: uiLocale === "ar" ? "جرب كلمة بحث تانية." : "Try a different search term.",
    duplicate: uiLocale === "ar" ? "تكرار" : "Duplicate",
    duplicateTitle: uiLocale === "ar" ? "تكرار المنتج" : "Duplicate product",
    featured: uiLocale === "ar" ? "مميز" : "Featured",
    ofTotal: uiLocale === "ar" ? "من" : "of",
    archive: uiLocale === "ar" ? "أرشفة" : "Archive",
    restore: uiLocale === "ar" ? "استرجاع" : "Restore",
    archiveTitle: uiLocale === "ar" ? "أرشفة المنتج؟" : "Archive product?",
    restoreTitle: uiLocale === "ar" ? "استرجاع المنتج؟" : "Restore product?",
    archiveDesc: uiLocale === "ar"
      ? "هيتخفي من المتجر بس هيتسجل في تاريخ المبيعات. تقدر ترجعه في أي وقت."
      : "It will be hidden from the shop. Sales history is preserved. You can restore it anytime.",
    restoreDesc: uiLocale === "ar"
      ? "هيظهر في المتجر تاني (لو مفعّل)."
      : "It will be visible in the shop again.",
    confirm: uiLocale === "ar" ? "تأكيد" : "Confirm",
    cancel: uiLocale === "ar" ? "إلغاء" : "Cancel",
  };

  async function handleToggleActive() {
    if (!confirmTarget) return;
    setWorking(true);
    const next = !confirmTarget.is_active;
    const res = await setProductActive(confirmTarget.id, next);
    setWorking(false);
    if (res.ok) {
      toast.success(
        next
          ? (uiLocale === "ar" ? "تم استرجاع المنتج." : "Product restored.")
          : (uiLocale === "ar" ? "تم أرشفة المنتج." : "Product archived.")
      );
      setConfirmTarget(null);
      router.refresh();
    } else {
      toast.error(res.error ?? (uiLocale === "ar" ? "فشلت العملية" : "Operation failed"));
    }
  }

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
            placeholder={L.searchPlaceholder}
            className="ps-9 bg-white border-paws-sand"
          />
        </div>
        <div className="flex items-center gap-2">
          {query && (
            <span className="text-xs text-muted-foreground">
              {filtered.length} {L.ofTotal} {products.length}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="gap-1.5 border-paws-sand"
          >
            <Download className="w-4 h-4" /> {L.exportCsv}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-paws-sand overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paws-sand bg-paws-cream/50">
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">{L.image}</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">{L.productCol}</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">SKU</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">{L.categoryCol}</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">{L.priceCol}</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">{L.costCol}</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">{L.statusCol}</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">{L.actionsCol}</th>
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
                          {query ? L.noMatches : t("no_products")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {query ? L.differentSearch : ""}
                        </p>
                      </div>
                      {!query && (
                        <Link href={`/${locale}/products/new`}>
                          <Button size="sm" className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white mt-2">
                            <Plus className="w-4 h-4" /> {t("add")}
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
                            {price.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{tCommon("egp")}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {cost != null ? (
                          <span className="text-muted-foreground text-sm">
                            {cost.toLocaleString()} {tCommon("egp")}
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
                            {product.is_active ? tSettings("active") : tSettings("inactive")}
                          </Badge>
                          {product.is_featured && (
                            <Badge className="bg-paws-orange/10 text-paws-orange hover:bg-paws-orange/10 w-fit text-[10px]">
                              {L.featured}
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/${locale}/products/${product.id}/edit`}>
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-paws-orange hover:text-paws-orange/80 hover:bg-paws-orange/5">
                              <Pencil className="w-3.5 h-3.5" />
                              {tCommon("edit")}
                            </Button>
                          </Link>
                          <Link href={`/${locale}/products/new?duplicate=${product.id}`} title={L.duplicateTitle}>
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-paws-brown hover:text-paws-brown/80 hover:bg-paws-cream/50">
                              <Copy className="w-3.5 h-3.5" />
                              {L.duplicate}
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmTarget(product)}
                            className="h-8 gap-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50"
                            title={product.is_active ? L.archive : L.restore}
                          >
                            {product.is_active ? (
                              <Archive className="w-3.5 h-3.5" />
                            ) : (
                              <ArchiveRestore className="w-3.5 h-3.5" />
                            )}
                            {product.is_active ? L.archive : L.restore}
                          </Button>
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

      <Dialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmTarget?.is_active ? L.archiveTitle : L.restoreTitle}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget
                ? `${confirmTarget.name_en} — ${confirmTarget.is_active ? L.archiveDesc : L.restoreDesc}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)} disabled={working}>
              {L.cancel}
            </Button>
            <Button
              onClick={handleToggleActive}
              disabled={working}
              className={confirmTarget?.is_active ? "bg-red-600 hover:bg-red-700 text-white gap-1.5" : "bg-paws-orange hover:bg-paws-orange/90 text-white gap-1.5"}
            >
              {working && <Loader2 className="w-4 h-4 animate-spin" />}
              {L.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
