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
import { Loader2, Layers, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { mergeWithWeights, type ConsolidateItem } from "@/app/[locale]/(dashboard)/products/[id]/actions";

interface ConsolidateWeightsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ProductOption = {
  id: string;
  name_en: string;
  name_ar: string;
  brand: string | null;
  sku: string;
};

type SourceEntry = {
  product: ProductOption;
  weight: string;
  size: string;
};

function parseWeight(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export function ConsolidateWeightsDialog({ open, onOpenChange }: ConsolidateWeightsDialogProps) {
  const router = useRouter();
  const locale = useLocale();
  const isAr = locale === "ar";
  const supabase = useMemo(() => createClient(), []);

  // Target picker state.
  const [targetQuery, setTargetQuery] = useState("");
  const [targetResults, setTargetResults] = useState<ProductOption[]>([]);
  const [targetSearching, setTargetSearching] = useState(false);
  const [target, setTarget] = useState<ProductOption | null>(null);
  const [targetWeight, setTargetWeight] = useState("");
  const [targetSize, setTargetSize] = useState("");

  // Source picker state.
  const [sourceQuery, setSourceQuery] = useState("");
  const [sourceResults, setSourceResults] = useState<ProductOption[]>([]);
  const [sourceSearching, setSourceSearching] = useState(false);
  const [sources, setSources] = useState<SourceEntry[]>([]);

  const [working, setWorking] = useState(false);

  // Reset everything when the dialog closes.
  useEffect(() => {
    if (!open) {
      setTargetQuery("");
      setTargetResults([]);
      setTarget(null);
      setTargetWeight("");
      setTargetSize("");
      setSourceQuery("");
      setSourceResults([]);
      setSources([]);
      setWorking(false);
    }
  }, [open]);

  // Debounced target search.
  useEffect(() => {
    if (!open || target) return;
    const q = targetQuery.trim();
    if (q.length < 2) {
      setTargetResults([]);
      return;
    }
    let cancelled = false;
    setTargetSearching(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name_en, name_ar, brand, sku")
        .eq("is_active", true)
        .or(`name_en.ilike.%${q}%,name_ar.ilike.%${q}%,sku.ilike.%${q}%`)
        .limit(15);
      if (!cancelled) {
        setTargetResults((data as ProductOption[] | null) ?? []);
        setTargetSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [targetQuery, target, supabase, open]);

  // Debounced source search (excludes the chosen target and already-added sources).
  useEffect(() => {
    if (!open || !target) return;
    const q = sourceQuery.trim();
    if (q.length < 2) {
      setSourceResults([]);
      return;
    }
    let cancelled = false;
    setSourceSearching(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name_en, name_ar, brand, sku")
        .eq("is_active", true)
        .neq("id", target.id)
        .or(`name_en.ilike.%${q}%,name_ar.ilike.%${q}%,sku.ilike.%${q}%`)
        .limit(15);
      if (!cancelled) {
        const addedIds = new Set(sources.map((s) => s.product.id));
        const filtered = ((data as ProductOption[] | null) ?? []).filter((p) => !addedIds.has(p.id));
        setSourceResults(filtered);
        setSourceSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sourceQuery, target, sources, supabase, open]);

  function handleAddSource(opt: ProductOption) {
    setSources((prev) => [...prev, { product: opt, weight: "", size: "" }]);
    setSourceQuery("");
    setSourceResults([]);
  }

  function handleRemoveSource(id: string) {
    setSources((prev) => prev.filter((s) => s.product.id !== id));
  }

  function updateSource(id: string, patch: Partial<Pick<SourceEntry, "weight" | "size">>) {
    setSources((prev) =>
      prev.map((s) => (s.product.id === id ? { ...s, ...patch } : s))
    );
  }

  async function handleConfirm() {
    if (!target || sources.length === 0) return;
    setWorking(true);

    const items: ConsolidateItem[] = sources.map((s) => ({
      sourceProductId: s.product.id,
      weightKg: parseWeight(s.weight),
      sizeLabel: s.size.trim() || null,
    }));

    if (targetWeight.trim() || targetSize.trim()) {
      items.unshift({
        sourceProductId: target.id,
        weightKg: parseWeight(targetWeight),
        sizeLabel: targetSize.trim() || null,
      });
    }

    const res = await mergeWithWeights(target.id, items);
    setWorking(false);

    if (!res.ok) {
      toast.error(res.error ?? (isAr ? "فشل الدمج" : "Consolidation failed"));
      return;
    }
    toast.success(
      isAr
        ? `تم دمج ${res.consolidated ?? 0} منتج بنجاح`
        : `Consolidated ${res.consolidated ?? 0} product(s)`
    );
    onOpenChange(false);
    router.push(`/${locale}/products/${target.id}/edit`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-paws-orange" />
            {isAr ? "دمج المنتجات حسب الوزن" : "Consolidate weight variants"}
          </DialogTitle>
          <DialogDescription>
            {isAr
              ? "ادمج المنتجات المنفصلة لكل وزن في منتج واحد. مخزون ومبيعات كل مصدر هينتقلوا للمنتج الهدف، والمصادر هتتأرشف. حدّد وزن كل واحد."
              : "Fold separate per-weight products into one. Each source's stock and sales history moves to the target; sources are archived. Give each its weight."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* TARGET picker */}
          {!target && (
            <div className="space-y-2">
              <Label htmlFor="consolidate-target-search">
                {isAr ? "ابحث عن المنتج الهدف (هيتبقى)" : "Search target product (the one that remains)"}
              </Label>
              <Input
                id="consolidate-target-search"
                value={targetQuery}
                onChange={(e) => setTargetQuery(e.target.value)}
                placeholder={isAr ? "اسم أو كود..." : "Name or SKU..."}
                autoFocus
              />
              <div className="border border-paws-sand rounded-lg max-h-56 overflow-y-auto divide-y divide-paws-sand">
                {targetSearching && (
                  <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isAr ? "بيدور..." : "Searching..."}
                  </div>
                )}
                {!targetSearching && targetQuery.trim().length >= 2 && targetResults.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">
                    {isAr ? "لا توجد منتجات" : "No products found"}
                  </div>
                )}
                {!targetSearching &&
                  targetResults.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTarget(opt)}
                      className="w-full text-start p-3 hover:bg-paws-sand/20 transition-colors"
                    >
                      <p className="text-sm font-medium text-paws-brown-dark">
                        {isAr ? opt.name_ar : opt.name_en}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {opt.brand ? `${opt.brand} · ` : ""}
                        {opt.sku}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {target && (
            <div className="space-y-3">
              {/* Chosen target */}
              <div className="rounded-lg bg-paws-sand/30 px-3 py-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{isAr ? "الهدف" : "Target"}</p>
                    <p className="font-medium text-paws-brown-dark">
                      {isAr ? target.name_ar : target.name_en}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {target.brand ? `${target.brand} · ` : ""}
                      {target.sku}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    disabled={working}
                    onClick={() => {
                      setTarget(null);
                      setTargetWeight("");
                      setTargetSize("");
                      setSources([]);
                      setSourceQuery("");
                      setSourceResults([]);
                    }}
                  >
                    {isAr ? "غيّر" : "Change"}
                  </Button>
                </div>
                {/* Optional label for the target's own variants */}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="consolidate-target-weight" className="text-xs">
                      {isAr ? "وزن الهدف (كجم)" : "Target weight (kg)"}
                    </Label>
                    <Input
                      id="consolidate-target-weight"
                      type="number"
                      step="0.001"
                      min="0"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                      placeholder={isAr ? "اختياري" : "Optional"}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="consolidate-target-size" className="text-xs">
                      {isAr ? "وصف الحجم" : "Size label"}
                    </Label>
                    <Input
                      id="consolidate-target-size"
                      value={targetSize}
                      onChange={(e) => setTargetSize(e.target.value)}
                      placeholder={isAr ? "اختياري" : "Optional"}
                    />
                  </div>
                </div>
              </div>

              {/* Added sources */}
              {sources.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {isAr ? "المنتجات المصدر" : "Source products"}
                  </p>
                  {sources.map((s) => (
                    <div
                      key={s.product.id}
                      className="rounded-lg border border-paws-sand px-3 py-2 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-paws-brown-dark">
                            {isAr ? s.product.name_ar : s.product.name_en}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.product.brand ? `${s.product.brand} · ` : ""}
                            {s.product.sku}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          disabled={working}
                          onClick={() => handleRemoveSource(s.product.id)}
                          title={isAr ? "إزالة" : "Remove"}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor={`src-weight-${s.product.id}`} className="text-xs">
                            {isAr ? "الوزن (كجم)" : "Weight (kg)"}
                          </Label>
                          <Input
                            id={`src-weight-${s.product.id}`}
                            type="number"
                            step="0.001"
                            min="0"
                            value={s.weight}
                            onChange={(e) => updateSource(s.product.id, { weight: e.target.value })}
                            placeholder={isAr ? "مثلاً 4" : "e.g. 4"}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`src-size-${s.product.id}`} className="text-xs">
                            {isAr ? "وصف الحجم" : "Size label"}
                          </Label>
                          <Input
                            id={`src-size-${s.product.id}`}
                            value={s.size}
                            onChange={(e) => updateSource(s.product.id, { size: e.target.value })}
                            placeholder={isAr ? "اختياري" : "Optional"}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SOURCE picker */}
              <div className="space-y-2">
                <Label htmlFor="consolidate-source-search" className="flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  {isAr ? "أضف منتج مصدر" : "Add a source product"}
                </Label>
                <Input
                  id="consolidate-source-search"
                  value={sourceQuery}
                  onChange={(e) => setSourceQuery(e.target.value)}
                  placeholder={isAr ? "اسم أو كود..." : "Name or SKU..."}
                />
                {sourceQuery.trim().length >= 2 && (
                  <div className="border border-paws-sand rounded-lg max-h-48 overflow-y-auto divide-y divide-paws-sand">
                    {sourceSearching && (
                      <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isAr ? "بيدور..." : "Searching..."}
                      </div>
                    )}
                    {!sourceSearching && sourceResults.length === 0 && (
                      <div className="p-4 text-sm text-muted-foreground">
                        {isAr ? "لا توجد منتجات" : "No products found"}
                      </div>
                    )}
                    {!sourceSearching &&
                      sourceResults.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleAddSource(opt)}
                          className="w-full text-start p-3 hover:bg-paws-sand/20 transition-colors"
                        >
                          <p className="text-sm font-medium text-paws-brown-dark">
                            {isAr ? opt.name_ar : opt.name_en}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {opt.brand ? `${opt.brand} · ` : ""}
                            {opt.sku}
                          </p>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={working}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!target || sources.length === 0 || working}
            className="bg-paws-orange hover:bg-paws-orange/90 text-white gap-1.5"
          >
            {working && <Loader2 className="w-4 h-4 animate-spin" />}
            {working
              ? isAr
                ? "بيتم الدمج..."
                : "Consolidating..."
              : isAr
                ? "دمج"
                : "Consolidate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
