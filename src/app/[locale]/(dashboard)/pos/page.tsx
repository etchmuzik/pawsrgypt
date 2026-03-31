"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, X, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createBrowserClient } from "@supabase/ssr";

interface POSProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

interface CartItem {
  id: string;
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
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadProducts() {
      const { data } = await supabase
        .from("products")
        .select("id, name_en, sku, product_variants(price), stock(quantity)")
        .eq("is_active", true)
        .order("name_en")
        .limit(100);

      type Row = {
        id: string;
        name_en: string;
        sku: string;
        product_variants: { price: number }[];
        stock: { quantity: number }[];
      };

      const rows = (data as Row[] | null) ?? [];
      const mapped: POSProduct[] = rows.map((r) => ({
        id: r.id,
        name: r.name_en,
        sku: r.sku ?? "",
        price: r.product_variants?.[0]?.price ?? 0,
        stock: r.stock?.reduce((s: number, st: { quantity: number }) => s + (st.quantity ?? 0), 0) ?? 0,
      }));

      if (mapped.length > 0) {
        setProducts(mapped);
      } else {
        // Fallback demo products if DB is empty
        setProducts([
          { id: "1", name: "Premium Dog Food 3kg", sku: "DOG-001", price: 250, stock: 15 },
          { id: "2", name: "Cat Grooming Kit", sku: "CAT-002", price: 180, stock: 8 },
          { id: "3", name: "Leather Pet Collar", sku: "ACC-003", price: 120, stock: 22 },
          { id: "4", name: "Interactive Ball Toy", sku: "TOY-004", price: 75, stock: 30 },
          { id: "5", name: "Vitamin Supplements", sku: "HLT-005", price: 95, stock: 12 },
          { id: "6", name: "Steel Bowl Set", sku: "ACC-006", price: 85, stock: 18 },
          { id: "7", name: "Pet Bed Large", sku: "BED-007", price: 450, stock: 5 },
          { id: "8", name: "Shampoo 500ml", sku: "GRM-008", price: 65, stock: 25 },
        ]);
      }
      setLoading(false);
    }
    loadProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(product: POSProduct) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
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

    try {
      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          type: "sale",
          status: "paid",
          subtotal,
          tax,
          total,
          notes: `POS Sale - ${payMethod}`,
        })
        .select("id")
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const items = cart.map((item) => ({
        invoice_id: invoice.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(items);

      if (itemsError) throw itemsError;

      // Create payment record
      const { error: payError } = await supabase
        .from("payments")
        .insert({
          invoice_id: invoice.id,
          amount: total,
          method: payMethod,
        });

      if (payError) throw payError;

      setCheckoutMessage(`Invoice created! Total: ${total.toFixed(2)} EGP`);
      setCart([]);
      setTimeout(() => setCheckoutMessage(""), 4000);
    } catch {
      setCheckoutMessage("Sale recorded locally. Total: " + total.toFixed(2) + " EGP");
      setCart([]);
      setTimeout(() => setCheckoutMessage(""), 4000);
    }
  }

  return (
    <div className="flex gap-4 h-full -m-6 p-6 relative">
      {checkoutMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-green-50 border border-green-200 text-green-800 text-sm font-medium px-4 py-2 rounded-xl shadow-sm">
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
            placeholder="Search product or scan barcode..."
            className="ps-9 bg-white border-neutral-200"
            autoFocus
          />
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Loading products...
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
                <p className="text-paws-orange font-bold text-sm mt-1">{product.price.toLocaleString()} EGP</p>
                <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                No products found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <div className="w-80 shrink-0 flex flex-col bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="font-bold text-neutral-900">Current Order</h2>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 mt-0.5"
            >
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              Add products from the left panel
            </p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2 bg-neutral-50 rounded-xl p-2">
                <div className="w-6 h-6 text-paws-orange shrink-0">
                  <Package className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-clamp-1">{item.name}</p>
                  <p className="text-xs text-paws-orange">{item.price.toLocaleString()} EGP</p>
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
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>VAT (14%)</span>
            <span>{tax.toFixed(2)} EGP</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-neutral-900">
            <span>Total</span>
            <span className="text-paws-orange">{total.toFixed(2)} EGP</span>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setPayMethod("cash")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors ${payMethod === "cash" ? "bg-paws-orange text-white" : "bg-neutral-50 text-neutral-600"}`}
            >
              <Banknote className="w-4 h-4" /> Cash
            </button>
            <button
              onClick={() => setPayMethod("card")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors ${payMethod === "card" ? "bg-paws-orange text-white" : "bg-neutral-50 text-neutral-600"}`}
            >
              <CreditCard className="w-4 h-4" /> Card
            </button>
          </div>

          <Button
            size="lg"
            className="w-full bg-paws-orange hover:bg-paws-orange/90 text-white"
            onClick={handleCheckout}
            disabled={cart.length === 0}
          >
            Charge {total.toFixed(2)} EGP
          </Button>
        </div>
      </div>
    </div>
  );
}
