"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useLocale } from "next-intl";
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, X, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

interface POSProduct {
  id: string;          // VARIANT id (unique tile key + cart key)
  productId: string;   // parent product id
  variantId: string;   // same as id; explicit for checkout clarity
  name: string;        // product name + variant label (e.g. "ALPHA Dog Food · 4 kg")
  sku: string;
  barcode: string;
  price: number;
  stock: number;       // stock for THIS variant at the chosen warehouse (sum of its stock rows)
}

interface CartItem {
  id: string;          // variant id
  productId: string;
  variantId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function POSPage() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payMethod, setPayMethod] = useState<"cash" | "card">("cash");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const isAr = locale === "ar";
  const L = {
    egp: isAr ? "ج.م" : "EGP",
    searchPlaceholder: isAr ? "دور على منتج أو امسح الباركود..." : "Search product or scan barcode...",
    loadingProducts: isAr ? "جاري تحميل المنتجات..." : "Loading products...",
    stock: isAr ? "المخزون" : "Stock",
    noProducts: isAr ? "مفيش منتجات" : "No products found",
    currentOrder: isAr ? "الطلب الحالي" : "Current Order",
    clearAll: isAr ? "امسح الكل" : "Clear all",
    addFromLeft: isAr ? "ضيف منتجات من اللوحة" : "Add products from the left panel",
    subtotal: isAr ? "المجموع" : "Subtotal",
    vat: isAr ? "ضريبة القيمة المضافة (14%)" : "VAT (14%)",
    total: isAr ? "الإجمالي" : "Total",
    cash: isAr ? "كاش" : "Cash",
    card: isAr ? "كارت" : "Card",
    charge: isAr ? "تحصيل" : "Charge",
    checkoutFailedPrefix: isAr ? "فشل الدفع" : "Checkout failed",
    invoiceCreated: isAr ? "تم إنشاء الفاتورة! الإجمالي" : "Invoice created! Total",
    unknownError: isAr ? "خطأ غير معروف" : "Unknown error",
    checkoutRetry: isAr ? "حاول تاني." : "Please try again.",
  };

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadProducts() {
      const { data: whData } = await supabase
        .from("warehouses").select("id").eq("is_active", true).order("name").limit(1);
      const wh = (whData as { id: string }[] | null)?.[0]?.id ?? "";
      setWarehouseId(wh);

      // Load current user + their branch (invoices/payments require created_by & branch_id, NOT NULL).
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? "";
      setUserId(uid);
      if (uid) {
        const { data: profile } = await supabase
          .from("profiles").select("branch_id").eq("id", uid).maybeSingle();
        const profileBranch = (profile as { branch_id: string | null } | null)?.branch_id ?? null;
        if (profileBranch) {
          setBranchId(profileBranch);
        } else {
          const { data: firstBranch } = await supabase
            .from("branches").select("id").order("created_at").limit(1).maybeSingle();
          setBranchId((firstBranch as { id: string } | null)?.id ?? "");
        }
      }

      const { data } = await supabase
        .from("products")
        .select("id, name_en, sku, product_variants(id, price, size, weight, color, is_active, barcode), stock(quantity, variant_id)")
        .eq("is_active", true)
        .order("name_en")
        .limit(100);

      type VRow = { id: string; price: number; size: string | null; weight: number | null; color: string | null; is_active: boolean; barcode: string | null };
      type Row = {
        id: string;
        name_en: string;
        sku: string;
        product_variants: VRow[];
        stock: { quantity: number; variant_id: string | null }[];
      };

      const rows = (data as Row[] | null) ?? [];
      const mapped: POSProduct[] = [];
      for (const r of rows) {
        const activeVariants = (r.product_variants ?? []).filter((v) => v.is_active);
        const single = activeVariants.length === 1;
        for (const v of activeVariants) {
          const labelParts: string[] = [];
          if (v.size) labelParts.push(v.size);
          else if (v.weight != null) labelParts.push(`${v.weight} ${isAr ? "كجم" : "kg"}`);
          if (v.color) labelParts.push(v.color);
          const label = labelParts.join(" · ");
          const stockQty = (r.stock ?? [])
            .filter((s) => s.variant_id === v.id || (single && s.variant_id === null))
            .reduce((sum, s) => sum + (s.quantity ?? 0), 0);
          mapped.push({
            id: v.id,
            productId: r.id,
            variantId: v.id,
            name: label ? `${r.name_en} · ${label}` : r.name_en,
            sku: r.sku ?? "",
            barcode: v.barcode ?? "",
            price: v.price ?? 0,
            stock: stockQty,
          });
        }
      }

      if (mapped.length > 0) {
        setProducts(mapped);
      } else {
        // Fallback demo products if DB is empty
        setProducts([
          { id: "1", productId: "1", variantId: "1", name: "Premium Dog Food 3kg", sku: "DOG-001", barcode: "", price: 250, stock: 15 },
          { id: "2", productId: "2", variantId: "2", name: "Cat Grooming Kit", sku: "CAT-002", barcode: "", price: 180, stock: 8 },
          { id: "3", productId: "3", variantId: "3", name: "Leather Pet Collar", sku: "ACC-003", barcode: "", price: 120, stock: 22 },
          { id: "4", productId: "4", variantId: "4", name: "Interactive Ball Toy", sku: "TOY-004", barcode: "", price: 75, stock: 30 },
          { id: "5", productId: "5", variantId: "5", name: "Vitamin Supplements", sku: "HLT-005", barcode: "", price: 95, stock: 12 },
          { id: "6", productId: "6", variantId: "6", name: "Steel Bowl Set", sku: "ACC-006", barcode: "", price: 85, stock: 18 },
          { id: "7", productId: "7", variantId: "7", name: "Pet Bed Large", sku: "BED-007", barcode: "", price: 450, stock: 5 },
          { id: "8", productId: "8", variantId: "8", name: "Shampoo 500ml", sku: "GRM-008", barcode: "", price: 65, stock: 25 },
        ]);
      }
      setLoading(false);
    }
    loadProducts();
  }, [supabase, isAr]);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(product: POSProduct) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { id: product.id, productId: product.productId, variantId: product.variantId, name: product.name, price: product.price, quantity: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = subtotal * 0.14;
  const total = subtotal + tax;

  async function handleCheckout() {
    if (cart.length === 0) return;

    if (!userId || !branchId) {
      setCheckoutMessage(`${L.checkoutFailedPrefix}: ${isAr ? "لا يوجد فرع أو مستخدم. سجّل الدخول من جديد." : "Missing branch or user. Please re-login."}`);
      setTimeout(() => setCheckoutMessage(""), 6000);
      return;
    }

    try {
      // Create invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          type: "sale",
          status: "paid",
          subtotal,
          tax_amount: tax,          // 'tax' is a generated column; write the writable 'tax_amount'
          total,
          branch_id: branchId,      // NOT NULL
          created_by: userId,       // NOT NULL
          notes: `POS Sale - ${payMethod}`,
        } as never)
        .select("id")
        .single();

      if (invoiceError) throw invoiceError;
      const invoice = invoiceData as unknown as { id: string };

      // Create invoice items
      const items = cart.map((item) => ({
        invoice_id: invoice.id,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(items as never);

      if (itemsError) throw itemsError;

      // Create payment record
      const { error: payError } = await supabase
        .from("payments")
        .insert({
          invoice_id: invoice.id,
          amount: total,
          method: payMethod,
          created_by: userId,
        } as never);

      if (payError) throw payError;

      // Stock decrement + audit movement run server-side (admin client) so they
      // work for cashier role too (stock_movements RLS excludes cashier) and can
      // fall back to legacy null-variant stock rows. Non-fatal: the sale is recorded.
      const { data: auth } = await supabase.auth.getUser();
      const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
      const saleLines = cart
        .filter((i) => isUuid(i.productId) && isUuid(i.variantId))
        .map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity }));
      if (auth?.user && warehouseId && saleLines.length > 0) {
        try {
          await fetch("/api/pos-sale", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              invoiceId: invoice.id,
              warehouseId,
              userId: auth.user.id,
              lines: saleLines,
            }),
          });
        } catch {
          // Non-fatal: sale already recorded; stock sync is best-effort.
        }
      }

      setCheckoutMessage(`${L.invoiceCreated}: ${total.toFixed(2)} ${L.egp}`);
      setCart([]);
      setTimeout(() => setCheckoutMessage(""), 4000);
    } catch (err) {
      const message = err instanceof Error ? err.message : L.unknownError;
      setCheckoutMessage(`${L.checkoutFailedPrefix}: ${message}. ${L.checkoutRetry}`);
      setTimeout(() => setCheckoutMessage(""), 6000);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full lg:-m-6 lg:p-6 relative">
      {checkoutMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`absolute top-2 left-1/2 -translate-x-1/2 z-50 text-sm font-medium px-4 py-2 rounded-xl shadow-sm ${
            checkoutMessage.startsWith(L.checkoutFailedPrefix)
              ? "bg-red-50 border border-red-200 text-red-800"
              : "bg-green-50 border border-green-200 text-green-800"
          }`}
        >
          {checkoutMessage}
        </div>
      )}

      {/* Left: Products */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="relative mb-4">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={L.searchPlaceholder}
            className="ps-9 bg-white border-neutral-200"
            autoFocus
          />
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            {L.loadingProducts}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto">
            {filtered.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white border border-neutral-200 rounded-2xl p-3 text-start hover:border-paws-orange hover:shadow-sm transition-all active:scale-95"
              >
                <div className="w-8 h-8 mb-1 text-paws-orange">
                  <Package className="w-8 h-8" />
                </div>
                <p className="text-xs font-semibold text-neutral-900 leading-tight line-clamp-2">{product.name}</p>
                <p className="text-paws-orange font-bold text-sm mt-1">{product.price.toLocaleString()} {L.egp}</p>
                <p className="text-xs text-muted-foreground">{L.stock}: {product.stock}</p>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                {L.noProducts}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="font-bold text-neutral-900">{L.currentOrder}</h2>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 mt-0.5"
            >
              <X className="w-3 h-3" /> {L.clearAll}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              {L.addFromLeft}
            </p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2 bg-neutral-50 rounded-xl p-2">
                <div className="w-6 h-6 text-paws-orange shrink-0">
                  <Package className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-clamp-1">{item.name}</p>
                  <p className="text-xs text-paws-orange">{item.price.toLocaleString()} {L.egp}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center hover:bg-paws-orange hover:text-white transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center hover:bg-paws-orange hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="w-6 h-6 rounded-full text-muted-foreground hover:text-destructive transition-colors ms-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-neutral-200 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{L.subtotal}</span>
            <span>{subtotal.toFixed(2)} {L.egp}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{L.vat}</span>
            <span>{tax.toFixed(2)} {L.egp}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-neutral-900">
            <span>{L.total}</span>
            <span className="text-paws-orange">{total.toFixed(2)} {L.egp}</span>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setPayMethod("cash")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors ${payMethod === "cash" ? "bg-paws-orange text-white" : "bg-neutral-50 text-neutral-600"}`}
            >
              <Banknote className="w-4 h-4" /> {L.cash}
            </button>
            <button
              onClick={() => setPayMethod("card")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors ${payMethod === "card" ? "bg-paws-orange text-white" : "bg-neutral-50 text-neutral-600"}`}
            >
              <CreditCard className="w-4 h-4" /> {L.card}
            </button>
          </div>

          <Button
            size="lg"
            className="w-full bg-paws-orange hover:bg-paws-orange/90 text-white"
            onClick={handleCheckout}
            disabled={cart.length === 0}
          >
            {L.charge} {total.toFixed(2)} {L.egp}
          </Button>
        </div>
      </div>
    </div>
  );
}
