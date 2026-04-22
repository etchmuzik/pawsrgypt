"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { updatePurchaseOrder } from "@/app/[locale]/(dashboard)/purchases/[id]/actions";

interface SupplierOption {
  id: string;
  name: string;
}

interface BranchOption {
  id: string;
  name: string;
}

interface ProductOption {
  id: string;
  sku: string | null;
  name_en: string;
  cost_price: number | null;
}

interface LineState {
  key: string;
  product_id: string;
  variant_id: string | null;
  quantity: string;
  unit_cost: string;
}

interface InitialOrder {
  id: string;
  supplier_id: string;
  branch_id: string;
  notes: string | null;
  discount: number;
  subtotal: number;
  tax_amount: number;
  items: Array<{
    product_id: string;
    variant_id: string | null;
    quantity: number;
    unit_cost: number;
  }>;
}

interface PurchaseOrderEditFormProps {
  initial: InitialOrder;
  suppliers: SupplierOption[];
  branches: BranchOption[];
  products: ProductOption[];
}

function genKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmt(n: number): string {
  return n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PurchaseOrderEditForm({ initial, suppliers, branches, products }: PurchaseOrderEditFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("purchases");
  const tCommon = useTranslations("common");
  const L = {
    select: locale === "ar" ? "— اختار —" : "— Select —",
    product: locale === "ar" ? "المنتج" : "Product",
    qty: locale === "ar" ? "الكمية" : "Qty",
    unitCost: locale === "ar" ? "سعر الوحدة" : "Unit Cost",
    lineTotal: locale === "ar" ? "إجمالي السطر" : "Line Total",
    remove: locale === "ar" ? "شيل السطر" : "Remove line",
    addLine: locale === "ar" ? "ضيف سطر" : "Add Line",
    discount: locale === "ar" ? "الخصم" : "Discount",
    taxRate: locale === "ar" ? "نسبة الضريبة (%)" : "Tax Rate (%)",
    failed: locale === "ar" ? "فشل الحفظ" : "Failed to save",
  };
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [supplierId, setSupplierId] = useState(initial.supplier_id);
  const [branchId, setBranchId] = useState(initial.branch_id);
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [discount, setDiscount] = useState(String(initial.discount || 0));

  // derive implied tax rate from initial subtotal / tax_amount if possible
  const impliedRate = initial.subtotal > 0 ? (initial.tax_amount / Math.max(initial.subtotal - initial.discount, 1)) * 100 : 14;
  const [taxRate, setTaxRate] = useState(String(round2(impliedRate || 14)));

  const [lines, setLines] = useState<LineState[]>(
    initial.items.length
      ? initial.items.map((i) => ({
          key: genKey(),
          product_id: i.product_id,
          variant_id: i.variant_id,
          quantity: String(i.quantity),
          unit_cost: String(i.unit_cost),
        }))
      : [{ key: genKey(), product_id: "", variant_id: null, quantity: "1", unit_cost: "0" }],
  );

  function updateLine(key: string, patch: Partial<LineState>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { key: genKey(), product_id: "", variant_id: null, quantity: "1", unit_cost: "0" }]);
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
  }

  function selectProduct(key: string, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateLine(key, {
      product_id: productId,
      variant_id: null,
      unit_cost: product?.cost_price != null ? String(product.cost_price) : "0",
    });
  }

  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_cost) || 0), 0);
    const disc = Number(discount) || 0;
    const taxable = Math.max(0, subtotal - disc);
    const rate = Number(taxRate) || 0;
    const tax = round2(taxable * (rate / 100));
    const total = round2(taxable + tax);
    return { subtotal: round2(subtotal), discount: disc, tax, total };
  }, [lines, discount, taxRate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updatePurchaseOrder(initial.id, {
        supplier_id: supplierId,
        branch_id: branchId,
        notes: notes || null,
        discount: Number(discount) || 0,
        tax_rate: Number(taxRate) || 0,
        lines: lines.map((l) => ({
          product_id: l.product_id,
          variant_id: l.variant_id,
          quantity: Number(l.quantity) || 0,
          unit_cost: Number(l.unit_cost) || 0,
        })),
      });
      if (!res.success) {
        setError(res.error ?? L.failed);
        return;
      }
      router.push(`/${locale}/purchases/${initial.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="supplier">{t("supplier")}</Label>
          <select
            id="supplier"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            required
          >
            <option value="">{L.select}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="branch">{tCommon("branch")}</Label>
          <select
            id="branch"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            required
          >
            <option value="">{L.select}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground">{L.product}</th>
              <th className="text-right px-3 py-2 font-semibold text-muted-foreground w-28">{L.qty}</th>
              <th className="text-right px-3 py-2 font-semibold text-muted-foreground w-32">{L.unitCost}</th>
              <th className="text-right px-3 py-2 font-semibold text-muted-foreground w-32">{L.lineTotal}</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {lines.map((line) => {
              const lineTotal = (Number(line.quantity) || 0) * (Number(line.unit_cost) || 0);
              return (
                <tr key={line.key}>
                  <td className="px-3 py-2">
                    <select
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                      value={line.product_id}
                      onChange={(e) => selectProduct(line.key, e.target.value)}
                      required
                    >
                      <option value="">{L.select}</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.sku ? `${p.sku} · ` : ""}{p.name_en}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      className="text-right font-mono"
                      value={line.quantity}
                      onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="text-right font-mono"
                      value={line.unit_cost}
                      onChange={(e) => updateLine(line.key, { unit_cost: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(round2(lineTotal))}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      disabled={lines.length <= 1}
                      className="text-red-500 hover:text-red-700 disabled:opacity-30"
                      aria-label={L.remove}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1.5">
        <Plus className="w-4 h-4" /> {L.addLine}
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="discount">{L.discount} ({tCommon("egp")})</Label>
          <Input
            id="discount"
            type="number"
            step="0.01"
            min="0"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="taxRate">{L.taxRate}</Label>
          <Input
            id="taxRate"
            type="number"
            step="0.01"
            min="0"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="notes">{tCommon("notes")}</Label>
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="ml-auto max-w-xs bg-neutral-50 rounded-lg p-4 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">{tCommon("subtotal")}</span><span className="font-mono">{fmt(totals.subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">{L.discount}</span><span className="font-mono">-{fmt(totals.discount)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">{tCommon("tax")}</span><span className="font-mono">{fmt(totals.tax)}</span></div>
        <div className="flex justify-between font-bold pt-2 border-t border-neutral-300"><span>{tCommon("total")}</span><span className="font-mono">{fmt(totals.total)} {tCommon("egp")}</span></div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="bg-paws-orange hover:bg-paws-orange/90 text-white">
          {pending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {tCommon("save_changes")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>{tCommon("cancel")}</Button>
      </div>
    </form>
  );
}
