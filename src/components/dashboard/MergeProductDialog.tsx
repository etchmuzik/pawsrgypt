"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, GitMerge, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { mergeProducts, previewMerge, type MergePreview } from "@/app/[locale]/(dashboard)/products/[id]/actions";

interface MergeProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceProductId: string;
  sourceProductName: string;
  sourceBrand: string | null;
}

interface ProductOption {
  id: string;
  name_en: string;
  name_ar: string;
  brand: string | null;
  sku: string;
}

export function MergeProductDialog({
  open,
  onOpenChange,
  sourceProductId,
  sourceProductName,
  sourceBrand,
}: MergeProductDialogProps) {
  const router = useRouter();
  const locale = useLocale();
  const isAr = locale === "ar";
  const supabase = useMemo(() => createClient(), []);

  const [query, setQuery] = useState("");
  const [sameBrandOnly, setSameBrandOnly] = useState(true);
  const [results, setResults] = useState<ProductOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ProductOption | null>(null);
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [merging, setMerging] = useState(false);

  // Reset when dialog opens or closes.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelected(null);
      setPreview(null);
    }
  }, [open]);

  // Debounced search.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      let req = supabase
        .from("products")
        .select("id, name_en, name_ar, brand, sku")
        .eq("is_active", true)
        .neq("id", sourceProductId)
        .or(`name_en.ilike.%${q}%,name_ar.ilike.%${q}%,sku.ilike.%${q}%`)
        .limit(15);
      if (sameBrandOnly && sourceBrand) {
        req = req.eq("brand", sourceBrand);
      }
      const { data } = await req;
      if (!cancelled) {
        setResults((data as ProductOption[] | null) ?? []);
        setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, sameBrandOnly, sourceBrand, sourceProductId, supabase, open]);

  async function handleSelect(opt: ProductOption) {
    setSelected(opt);
    setPreviewing(true);
    setPreview(null);
    const res = await previewMerge(opt.id, sourceProductId);
    setPreview(res);
    setPreviewing(false);
  }

  async function handleConfirm() {
    if (!selected) return;
    setMerging(true);
    const res = await mergeProducts(selected.id, sourceProductId);
    setMerging(false);
    if (!res.ok) {
      toast.error(res.error ?? (isAr ? "فشل الدمج" : "Merge failed"));
      return;
    }
    toast.success(isAr ? "تم الدمج بنجاح" : "Merged successfully");
    onOpenChange(false);
    router.push(`/${locale}/products/${selected.id}/edit`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-paws-orange" />
            {isAr ? "دمج في منتج آخر" : "Merge into another product"}
          </DialogTitle>
          <DialogDescription>
            {isAr
              ? `كل المتغيرات والمخزون والمبيعات هينتقلوا إلى المنتج الهدف، والمنتج الحالي هيتعطل.`
              : `All variants, stock, and historical sales will move to the target product; this product will be deactivated.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg bg-paws-sand/30 px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground">
              {isAr ? "المصدر" : "Source"}
            </p>
            <p className="font-medium text-paws-brown-dark">{sourceProductName}</p>
          </div>

          {!selected && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="merge-search">
                  {isAr ? "ابحث عن المنتج الهدف" : "Search target product"}
                </Label>
                <Input
                  id="merge-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isAr ? "اسم أو كود..." : "Name or SKU..."}
                  autoFocus
                />
              </div>

              {sourceBrand && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={sameBrandOnly}
                    onChange={(e) => setSameBrandOnly(e.target.checked)}
                  />
                  {isAr ? `نفس البراند (${sourceBrand}) بس` : `Same brand (${sourceBrand}) only`}
                </label>
              )}

              <div className="border border-paws-sand rounded-lg max-h-64 overflow-y-auto divide-y divide-paws-sand">
                {searching && (
                  <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isAr ? "بيدور..." : "Searching..."}
                  </div>
                )}
                {!searching && query.trim().length >= 2 && results.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">
                    {isAr ? "لا توجد منتجات" : "No products found"}
                  </div>
                )}
                {!searching &&
                  results.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelect(opt)}
                      className="w-full text-start p-3 hover:bg-paws-sand/20 transition-colors"
                    >
                      <p className="text-sm font-medium text-paws-brown-dark">
                        {isAr ? opt.name_ar : opt.name_en}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {opt.brand ? `${opt.brand} · ` : ""}{opt.sku}
                      </p>
                    </button>
                  ))}
              </div>
            </>
          )}

          {selected && (
            <div className="space-y-3">
              <div className="rounded-lg bg-paws-sand/30 px-3 py-2 text-sm">
                <p className="text-xs text-muted-foreground">
                  {isAr ? "الهدف" : "Target"}
                </p>
                <p className="font-medium text-paws-brown-dark">
                  {isAr ? selected.name_ar : selected.name_en}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selected.brand ? `${selected.brand} · ` : ""}{selected.sku}
                </p>
              </div>

              {previewing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isAr ? "بنحسب..." : "Calculating..."}
                </div>
              )}

              {preview?.ok && preview.counts && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1 text-sm">
                  <div className="flex items-start gap-2 text-amber-900">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="font-medium">
                      {isAr ? "هتنتقل البيانات دي:" : "This will move:"}
                    </p>
                  </div>
                  <ul className="text-xs text-amber-900 ms-6 space-y-0.5">
                    <li>
                      {preview.counts.variants}{" "}
                      {isAr ? "متغير" : "variants"}
                    </li>
                    <li>
                      {preview.counts.stockRows}{" "}
                      {isAr ? "صف مخزون" : "stock rows"}
                    </li>
                    <li>
                      {preview.counts.invoiceItems}{" "}
                      {isAr ? "بند فاتورة" : "invoice line items"}
                    </li>
                    <li>
                      {preview.counts.purchaseItems}{" "}
                      {isAr ? "بند مشتريات" : "purchase line items"}
                    </li>
                    <li>
                      {preview.counts.stockMovements}{" "}
                      {isAr ? "حركة مخزون" : "stock movements"}
                    </li>
                  </ul>
                </div>
              )}

              {preview && !preview.ok && (
                <p className="text-sm text-red-600">{preview.error}</p>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelected(null);
                  setPreview(null);
                }}
                className="text-xs"
              >
                {isAr ? "اختار منتج تاني" : "Pick a different product"}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={merging}
          >
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selected || !preview?.ok || merging}
            className="bg-paws-orange hover:bg-paws-orange/90 text-white gap-1.5"
          >
            {merging && <Loader2 className="w-4 h-4 animate-spin" />}
            {merging ? (isAr ? "بيتم الدمج..." : "Merging...") : (isAr ? "دمج" : "Merge")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
