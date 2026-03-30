"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { Customer, Product, ProductVariant } from "@/lib/supabase/types";
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
  unitPrice: number;
  lineTotal: number;
}

type PaymentMethod = "cash" | "card" | "transfer" | "check";
type InvoiceStatus = "draft" | "confirmed";

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
  unitPrice: 0,
  lineTotal: 0,
};

const VAT_RATE = 0.14;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewInvoicePage() {
  const router = useRouter();
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);

  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Product search state
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [activeLineKey, setActiveLineKey] = useState<string | null>(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Line items
  const [lines, setLines] = useState<LineItem[]>([{ ...EMPTY_LINE }]);

  // Financials
  const [discount, setDiscount] = useState(0);

  // Payment
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  // Status & submission
  const [status, setStatus] = useState<InvoiceStatus>("confirmed");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- Derived calculations ----------
  const subtotal = useMemo(
    () => round2(lines.reduce((sum, l) => sum + l.lineTotal, 0)),
    [lines]
  );
  const taxAmount = useMemo(() => round2(subtotal * VAT_RATE), [subtotal]);
  const total = useMemo(
    () => round2(subtotal + taxAmount - discount),
    [subtotal, taxAmount, discount]
  );

  // ---------- Data fetching ----------
  const fetchCustomers = useCallback(
    async (search: string) => {
      const query = supabase
        .from("customers")
        .select("*")
        .eq("is_active", true)
        .order("name")
        .limit(20);

      if (search.trim()) {
        query.ilike("name", `%${search.trim()}%`);
      }

      const { data } = await query;
      setCustomers((data as Customer[]) ?? []);
    },
    [supabase]
  );

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
    fetchCustomers("");
  }, [fetchCustomers]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (customerSearch.trim()) {
        fetchCustomers(customerSearch);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [customerSearch, fetchCustomers]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (productSearch.trim()) {
        fetchProducts(productSearch);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [productSearch, fetchProducts]);

  // ---------- Line item operations ----------
  function updateLine(key: string, patch: Partial<LineItem>): void {
    setLines((prev) =>
      prev.map((line) => {
        if (line.key !== key) return line;
        const updated = { ...line, ...patch };
        updated.lineTotal = round2(updated.quantity * updated.unitPrice);
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
      unitPrice: variant?.price ?? 0,
      quantity: 1,
      lineTotal: variant?.price ?? 0,
    });
    setShowProductDropdown(false);
    setProductSearch("");
    setActiveLineKey(null);
  }

  // ---------- Submit ----------
  async function handleSubmit(): Promise<void> {
    setError(null);

    const validLines = lines.filter((l) => l.productId && l.quantity > 0);
    if (validLines.length === 0) {
      setError("Add at least one product line item.");
      return;
    }

    setSubmitting(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in.");
        setSubmitting(false);
        return;
      }

      // Get user's branch
      const { data: profile } = await supabase
        .from("profiles")
        .select("branch_id")
        .eq("id", user.id)
        .single();

      const branchId = (profile as { branch_id: string | null } | null)?.branch_id;
      if (!branchId) {
        setError("No branch assigned to your profile.");
        setSubmitting(false);
        return;
      }

      // 1. Insert invoice
      const { data: invoice, error: invoiceErr } = await supabase
        .from("invoices")
        .insert({
          type: "sale" as const,
          customer_id: selectedCustomer?.id ?? null,
          branch_id: branchId,
          sales_rep_id: user.id,
          status,
          subtotal,
          tax_amount: taxAmount,
          discount,
          total,
          paid: amountPaid,
          due_date: null,
          notes: null,
          created_by: user.id,
        } as never)
        .select("id")
        .single();

      if (invoiceErr || !invoice) {
        throw new Error(invoiceErr?.message ?? "Failed to create invoice.");
      }

      const invoiceId = (invoice as { id: string }).id;

      // 2. Insert line items
      const itemInserts = validLines.map((l) => ({
        invoice_id: invoiceId,
        product_id: l.productId,
        variant_id: l.variantId,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        discount: 0,
        total: l.lineTotal,
      }));

      const { error: itemsErr } = await supabase
        .from("invoice_items")
        .insert(itemInserts as never);

      if (itemsErr) {
        throw new Error(itemsErr.message);
      }

      // 3. Insert payment if amount paid > 0
      if (amountPaid > 0) {
        const { error: payErr } = await supabase.from("payments").insert({
          invoice_id: invoiceId,
          amount: amountPaid,
          method: paymentMethod,
          reference: null,
          notes: null,
          created_by: user.id,
        } as never);

        if (payErr) {
          throw new Error(payErr.message);
        }
      }

      // 4. Decrement stock quantities
      for (const line of validLines) {
        // Find stock row for this product in the branch's warehouse
        const { data: stockRows } = await supabase
          .from("stock")
          .select("id, quantity, warehouse_id, warehouses!inner(branch_id)")
          .eq("product_id", line.productId)
          .eq("warehouses.branch_id", branchId)
          .limit(1);

        const stockRow = (stockRows as Array<{ id: string; quantity: number }> | null)?.[0];

        if (stockRow) {
          await supabase
            .from("stock")
            .update({ quantity: stockRow.quantity - line.quantity } as never)
            .eq("id", stockRow.id);
        }
      }

      // 5. Update invoice status based on payment
      if (amountPaid >= total && total > 0) {
        await supabase
          .from("invoices")
          .update({ status: "paid" } as never)
          .eq("id", invoiceId);
      } else if (amountPaid > 0 && amountPaid < total) {
        await supabase
          .from("invoices")
          .update({ status: "partial" } as never)
          .eq("id", invoiceId);
      }

      router.push(`/${locale}/sales`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
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
          onClick={() => router.push(`/${locale}/sales`)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-paws-brown-dark">
          New Invoice
        </h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* ---- Customer & Status ---- */}
        <div className="bg-white rounded-2xl border border-paws-sand p-5">
          <h2 className="text-sm font-semibold text-paws-brown mb-4">
            Invoice Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer selector */}
            <div className="relative">
              <Label htmlFor="customer">Customer</Label>
              {selectedCustomer ? (
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-paws-sand bg-paws-cream/30 px-3 py-1.5 text-sm">
                  <span className="flex-1">
                    {selectedCustomer.name}
                    {selectedCustomer.phone && (
                      <span className="text-muted-foreground ml-2">
                        {selectedCustomer.phone}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-red-500"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearch("");
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
                      id="customer"
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => {
                        setShowCustomerDropdown(true);
                        fetchCustomers(customerSearch);
                      }}
                      onBlur={() =>
                        setTimeout(() => setShowCustomerDropdown(false), 200)
                      }
                      className="pl-8"
                    />
                  </div>
                  {showCustomerDropdown && customers.length > 0 && (
                    <div className="absolute z-30 mt-1 w-full rounded-lg border border-paws-sand bg-white shadow-lg max-h-48 overflow-y-auto">
                      {customers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-start px-3 py-2 text-sm hover:bg-paws-cream/50"
                          onMouseDown={() => {
                            setSelectedCustomer(c);
                            setShowCustomerDropdown(false);
                            setCustomerSearch("");
                          }}
                        >
                          <span className="font-medium">{c.name}</span>
                          {c.phone && (
                            <span className="text-muted-foreground ml-2 text-xs">
                              {c.phone}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                className="mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
          </div>
        </div>

        {/* ---- Line Items ---- */}
        <div className="bg-white rounded-2xl border border-paws-sand p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-paws-brown">
              Line Items
            </h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1 text-xs"
              onClick={addLine}
            >
              <Plus className="w-3.5 h-3.5" /> Add Item
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paws-sand">
                  <th className="text-start px-2 py-2 font-semibold text-paws-brown w-[40%]">
                    Product
                  </th>
                  <th className="text-start px-2 py-2 font-semibold text-paws-brown w-[10%]">
                    SKU
                  </th>
                  <th className="text-center px-2 py-2 font-semibold text-paws-brown w-[12%]">
                    Qty
                  </th>
                  <th className="text-end px-2 py-2 font-semibold text-paws-brown w-[15%]">
                    Unit Price
                  </th>
                  <th className="text-end px-2 py-2 font-semibold text-paws-brown w-[15%]">
                    Total
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
                              placeholder="Search product..."
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
                                      <span className="ml-2 text-paws-orange font-semibold">
                                        {p.product_variants[0].price} EGP
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

                    {/* Unit Price */}
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={line.unitPrice}
                        onChange={(e) =>
                          updateLine(line.key, {
                            unitPrice: Math.max(0, Number(e.target.value)),
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
          <h2 className="text-sm font-semibold text-paws-brown mb-4">
            Summary
          </h2>
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{subtotal.toFixed(2)} EGP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT (14%)</span>
              <span>{taxAmount.toFixed(2)} EGP</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Discount</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={discount}
                onChange={(e) =>
                  setDiscount(Math.max(0, Number(e.target.value)))
                }
                className="h-7 text-xs text-end w-28"
              />
            </div>
            <div className="flex justify-between border-t border-paws-sand pt-2 font-bold text-base">
              <span>Total</span>
              <span className="text-paws-orange">{total.toFixed(2)} EGP</span>
            </div>
          </div>
        </div>

        {/* ---- Payment ---- */}
        <div className="bg-white rounded-2xl border border-paws-sand p-5">
          <h2 className="text-sm font-semibold text-paws-brown mb-4">
            Payment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amountPaid">Amount Paid (EGP)</Label>
              <Input
                id="amountPaid"
                type="number"
                min={0}
                step={0.01}
                value={amountPaid}
                onChange={(e) =>
                  setAmountPaid(Math.max(0, Number(e.target.value)))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
                className="mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Bank Transfer</option>
                <option value="check">Check</option>
              </select>
            </div>
          </div>
          {amountPaid > 0 && amountPaid < total && (
            <p className="mt-2 text-xs text-yellow-600">
              Remaining balance: {(total - amountPaid).toFixed(2)} EGP
            </p>
          )}
        </div>

        {/* ---- Actions ---- */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/sales`)}
            disabled={submitting}
          >
            Cancel
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
            {submitting ? "Saving..." : "Create Invoice"}
          </Button>
        </div>
      </div>
    </div>
  );
}
