"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type {
  Supplier,
  Branch,
  Product,
  ProductVariant,
} from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Loader2,
  CheckCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LineItem {
  key: string;
  productId: string;
  variantId: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

interface ProductWithVariants extends Product {
  product_variants: ProductVariant[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const EMPTY_LINE: LineItem = {
  key: generateKey(),
  productId: "",
  variantId: null,
  productName: "",
  sku: "",
  quantity: 1,
  unitCost: 0,
  lineTotal: 0,
};

const TAX_RATE = 0.14;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const isAr = locale === "ar";
  const L = {
    title: isAr ? "أمر شراء جديد" : "New Purchase Order",
    orderDetails: isAr ? "بيانات الأمر" : "Order Details",
    supplier: isAr ? "المورد" : "Supplier",
    branch: isAr ? "الفرع" : "Branch",
    notesOpt: isAr ? "ملاحظات (اختياري)" : "Notes (optional)",
    notesPh: isAr ? "أي ملاحظات على أمر الشراء..." : "Any notes for this purchase order...",
    searchSuppliers: isAr ? "دور على موردين..." : "Search suppliers...",
    lineItems: isAr ? "الأصناف" : "Line Items",
    addItem: isAr ? "ضيف صنف" : "Add Item",
    product: isAr ? "المنتج" : "Product",
    qty: isAr ? "الكمية" : "Qty",
    unitCost: isAr ? "سعر الوحدة" : "Unit Cost",
    total: isAr ? "الإجمالي" : "Total",
    searchProduct: isAr ? "دور على منتج..." : "Search product...",
    cost: isAr ? "التكلفة" : "Cost",
    egp: isAr ? "ج.م" : "EGP",
    summary: isAr ? "الملخص" : "Summary",
    subtotal: isAr ? "المجموع" : "Subtotal",
    tax: isAr ? "ضريبة (14%)" : "Tax (14%)",
    cancel: isAr ? "إلغاء" : "Cancel",
    create: isAr ? "إنشاء أمر الشراء" : "Create Purchase Order",
    saving: isAr ? "بيتحفظ..." : "Saving...",
    pickSupplier: isAr ? "اختار مورد من فضلك." : "Please select a supplier.",
    pickBranch: isAr ? "اختار فرع من فضلك." : "Please select a branch.",
    needLine: isAr ? "ضيف صنف واحد على الأقل." : "Add at least one product line item.",
    mustLogin: isAr ? "لازم تسجل دخول." : "You must be logged in.",
    failedCreate: isAr ? "فشل إنشاء أمر الشراء." : "Failed to create purchase order.",
    unexpected: isAr ? "حصل خطأ غير متوقع." : "An unexpected error occurred.",
  };

  // Supplier
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Branch
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // Products
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [activeLineKey, setActiveLineKey] = useState<string | null>(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Lines
  const [lines, setLines] = useState<LineItem[]>([{ ...EMPTY_LINE }]);

  // Notes
  const [notes, setNotes] = useState("");

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- Derived ----------
  const subtotal = useMemo(
    () => round2(lines.reduce((sum, l) => sum + l.lineTotal, 0)),
    [lines]
  );
  const taxAmount = useMemo(() => round2(subtotal * TAX_RATE), [subtotal]);
  const total = useMemo(
    () => round2(subtotal + taxAmount),
    [subtotal, taxAmount]
  );

  // ---------- Data fetching ----------
  const fetchSuppliers = useCallback(
    async (search: string) => {
      const query = supabase
        .from("suppliers")
        .select("*")
        .eq("is_active", true)
        .order("name")
        .limit(20);

      if (search.trim()) {
        query.ilike("name", `%${search.trim()}%`);
      }

      const { data } = await query;
      setSuppliers((data as Supplier[]) ?? []);
    },
    [supabase]
  );

  const fetchBranches = useCallback(async () => {
    const { data } = await supabase
      .from("branches")
      .select("*")
      .eq("is_active", true)
      .order("name");
    const list = (data as Branch[]) ?? [];
    setBranches(list);
    if (list.length > 0 && !selectedBranchId) {
      setSelectedBranchId(list[0].id);
    }
  }, [supabase, selectedBranchId]);

  const fetchProducts = useCallback(
    async (search: string) => {
      const query = supabase
        .from("products")
        .select("*, product_variants(*)")
        .eq("is_active", true)
        .order("name_en")
        .limit(20);

      if (search.trim()) {
        query.or(
          `name_en.ilike.%${search.trim()}%,name_ar.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`
        );
      }

      const { data } = await query;
      setProducts((data as ProductWithVariants[]) ?? []);
    },
    [supabase]
  );

  useEffect(() => {
    fetchSuppliers("");
    fetchBranches();
  }, [fetchSuppliers, fetchBranches]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (supplierSearch.trim()) {
        fetchSuppliers(supplierSearch);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [supplierSearch, fetchSuppliers]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (productSearch.trim()) {
        fetchProducts(productSearch);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [productSearch, fetchProducts]);

  // ---------- Line item ops ----------
  function updateLine(key: string, patch: Partial<LineItem>): void {
    setLines((prev) =>
      prev.map((line) => {
        if (line.key !== key) return line;
        const updated = { ...line, ...patch };
        updated.lineTotal = round2(updated.quantity * updated.unitCost);
        return updated;
      })
    );
  }

  function addLine(): void {
    setLines((prev) => [...prev, { ...EMPTY_LINE, key: generateKey() }]);
  }

  function removeLine(key: string): void {
    setLines((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((l) => l.key !== key);
    });
  }

  function selectProduct(
    lineKey: string,
    product: ProductWithVariants
  ): void {
    const variant = product.product_variants?.[0];
    updateLine(lineKey, {
      productId: product.id,
      variantId: variant?.id ?? null,
      productName: product.name_en,
      sku: product.sku,
      unitCost: variant?.cost_price ?? 0,
      quantity: 1,
      lineTotal: variant?.cost_price ?? 0,
    });
    setShowProductDropdown(false);
    setProductSearch("");
    setActiveLineKey(null);
  }

  // ---------- Submit ----------
  async function handleSubmit(): Promise<void> {
    setError(null);

    if (!selectedSupplier) {
      setError(L.pickSupplier);
      return;
    }
    if (!selectedBranchId) {
      setError(L.pickBranch);
      return;
    }

    const validLines = lines.filter((l) => l.productId && l.quantity > 0);
    if (validLines.length === 0) {
      setError(L.needLine);
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError(L.mustLogin);
        setSubmitting(false);
        return;
      }

      // 1. Insert purchase order
      const { data: orderData, error: orderErr } = await supabase
        .from("purchase_orders")
        .insert({
          supplier_id: selectedSupplier.id,
          branch_id: selectedBranchId,
          status: "draft" as const,
          subtotal,
          tax_amount: taxAmount,
          discount: 0,
          total,
          notes: notes.trim() || null,
          ordered_at: null,
          received_at: null,
          created_by: user.id,
        } as never)
        .select("id")
        .single();

      const order = orderData as { id: string } | null;

      if (orderErr || !order) {
        throw new Error(
          orderErr?.message ?? L.failedCreate
        );
      }

      // 2. Insert purchase items
      const itemInserts = validLines.map((l) => ({
        order_id: order.id,
        product_id: l.productId,
        variant_id: l.variantId,
        quantity: l.quantity,
        unit_cost: l.unitCost,
        total: l.lineTotal,
      }));

      const { error: itemsErr } = await supabase
        .from("purchase_items")
        .insert(itemInserts as never);

      if (itemsErr) {
        throw new Error(itemsErr.message);
      }

      router.push(`/${locale}/purchases`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : L.unexpected;
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Render ----------
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${locale}/purchases`)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-paws-brown-dark">{L.title}</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* ---- Supplier & Branch ---- */}
        <div className="bg-white rounded-2xl border border-paws-sand p-5">
          <h2 className="text-sm font-semibold text-paws-brown mb-4">{L.orderDetails}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supplier selector */}
            <div className="relative">
              <Label htmlFor="supplier">{L.supplier}</Label>
              {selectedSupplier ? (
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-paws-sand bg-paws-cream/30 px-3 py-1.5 text-sm">
                  <span className="flex-1">
                    {selectedSupplier.name}
                    {selectedSupplier.phone && (
                      <span className="text-muted-foreground ml-2">
                        {selectedSupplier.phone}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-red-500"
                    onClick={() => {
                      setSelectedSupplier(null);
                      setSupplierSearch("");
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mt-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      id="supplier"
                      placeholder={L.searchSuppliers}
                      value={supplierSearch}
                      onChange={(e) => {
                        setSupplierSearch(e.target.value);
                        setShowSupplierDropdown(true);
                      }}
                      onFocus={() => {
                        setShowSupplierDropdown(true);
                        fetchSuppliers(supplierSearch);
                      }}
                      onBlur={() =>
                        setTimeout(() => setShowSupplierDropdown(false), 200)
                      }
                      className="pl-8"
                    />
                  </div>
                  {showSupplierDropdown && suppliers.length > 0 && (
                    <div className="absolute z-30 mt-1 w-full rounded-lg border border-paws-sand bg-white shadow-lg max-h-48 overflow-y-auto">
                      {suppliers.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="w-full text-start px-3 py-2 text-sm hover:bg-paws-cream/50"
                          onMouseDown={() => {
                            setSelectedSupplier(s);
                            setShowSupplierDropdown(false);
                            setSupplierSearch("");
                          }}
                        >
                          <span className="font-medium">{s.name}</span>
                          {s.phone && (
                            <span className="text-muted-foreground ml-2 text-xs">
                              {s.phone}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Branch selector */}
            <div>
              <Label htmlFor="branch">{L.branch}</Label>
              <select
                id="branch"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4">
            <Label htmlFor="notes">{L.notesOpt}</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
              placeholder={L.notesPh}
            />
          </div>
        </div>

        {/* ---- Line Items ---- */}
        <div className="bg-white rounded-2xl border border-paws-sand p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-paws-brown">{L.lineItems}</h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1 text-xs"
              onClick={addLine}
            >
              <Plus className="w-3.5 h-3.5" /> {L.addItem}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paws-sand">
                  <th className="text-start px-2 py-2 font-semibold text-paws-brown w-[40%]">
                    {L.product}
                  </th>
                  <th className="text-start px-2 py-2 font-semibold text-paws-brown w-[10%]">
                    SKU
                  </th>
                  <th className="text-center px-2 py-2 font-semibold text-paws-brown w-[12%]">
                    {L.qty}
                  </th>
                  <th className="text-end px-2 py-2 font-semibold text-paws-brown w-[15%]">
                    {L.unitCost}
                  </th>
                  <th className="text-end px-2 py-2 font-semibold text-paws-brown w-[15%]">
                    {L.total}
                  </th>
                  <th className="w-[8%]" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr
                    key={line.key}
                    className="border-b border-paws-sand/50"
                  >
                    {/* Product search */}
                    <td className="px-2 py-2 relative">
                      {line.productId ? (
                        <span className="text-sm">{line.productName}</span>
                      ) : (
                        <>
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                            <Input
                              placeholder={L.searchProduct}
                              value={
                                activeLineKey === line.key ? productSearch : ""
                              }
                              onChange={(e) => {
                                setActiveLineKey(line.key);
                                setProductSearch(e.target.value);
                                setShowProductDropdown(true);
                              }}
                              onFocus={() => {
                                setActiveLineKey(line.key);
                                setShowProductDropdown(true);
                                fetchProducts("");
                              }}
                              onBlur={() =>
                                setTimeout(
                                  () => setShowProductDropdown(false),
                                  200
                                )
                              }
                              className="pl-7 h-7 text-xs"
                            />
                          </div>
                          {showProductDropdown &&
                            activeLineKey === line.key &&
                            products.length > 0 && (
                              <div className="absolute z-30 left-2 right-2 mt-1 rounded-lg border border-paws-sand bg-white shadow-lg max-h-48 overflow-y-auto">
                                {products.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    className="w-full text-start px-3 py-2 text-xs hover:bg-paws-cream/50"
                                    onMouseDown={() =>
                                      selectProduct(line.key, p)
                                    }
                                  >
                                    <span className="font-medium">
                                      {p.name_en}
                                    </span>
                                    <span className="text-muted-foreground ml-2">
                                      {p.sku}
                                    </span>
                                    {p.product_variants?.[0] && (
                                      <span className="ml-2 text-paws-brown font-semibold">
                                        {L.cost}: {p.product_variants[0].cost_price}{" "}
                                        {L.egp}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                        </>
                      )}
                    </td>

                    {/* SKU */}
                    <td className="px-2 py-2 text-xs font-mono text-muted-foreground">
                      {line.sku || "---"}
                    </td>

                    {/* Quantity */}
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(line.key, {
                            quantity: Math.max(1, Number(e.target.value)),
                          })
                        }
                        className="h-7 text-xs text-center w-16 mx-auto"
                      />
                    </td>

                    {/* Unit Cost */}
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={line.unitCost}
                        onChange={(e) =>
                          updateLine(line.key, {
                            unitCost: Math.max(0, Number(e.target.value)),
                          })
                        }
                        className="h-7 text-xs text-end w-24 ml-auto"
                      />
                    </td>

                    {/* Line Total */}
                    <td className="px-2 py-2 text-end font-semibold">
                      {line.lineTotal.toFixed(2)}
                    </td>

                    {/* Remove */}
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        className="text-muted-foreground hover:text-red-500 disabled:opacity-30"
                        disabled={lines.length <= 1}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---- Summary ---- */}
        <div className="bg-white rounded-2xl border border-paws-sand p-5">
          <h2 className="text-sm font-semibold text-paws-brown mb-4">{L.summary}</h2>
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{L.subtotal}</span>
              <span>{subtotal.toFixed(2)} {L.egp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{L.tax}</span>
              <span>{taxAmount.toFixed(2)} {L.egp}</span>
            </div>
            <div className="flex justify-between border-t border-paws-sand pt-2 font-bold text-base">
              <span>{L.total}</span>
              <span className="text-paws-orange">{total.toFixed(2)} {L.egp}</span>
            </div>
          </div>
        </div>

        {/* ---- Actions ---- */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/purchases`)}
            disabled={submitting}
          >
            {L.cancel}
          </Button>
          <Button
            className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {submitting ? L.saving : L.create}
          </Button>
        </div>
      </div>
    </div>
  );
}
