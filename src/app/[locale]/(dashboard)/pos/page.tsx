"use client";

import { useState } from "react";
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Placeholder — replace with live Supabase query
const DEMO_PRODUCTS = [
  { id: "1", name: "Premium Dog Food 3kg", sku: "DOG-001", price: 250, emoji: "🍖", stock: 15 },
  { id: "2", name: "Cat Grooming Kit", sku: "CAT-002", price: 180, emoji: "✂️", stock: 8 },
  { id: "3", name: "Leather Pet Collar", sku: "ACC-003", price: 120, emoji: "🎀", stock: 22 },
  { id: "4", name: "Interactive Ball Toy", sku: "TOY-004", price: 75, emoji: "🎾", stock: 30 },
  { id: "5", name: "Vitamin Supplements", sku: "HLT-005", price: 95, emoji: "💊", stock: 12 },
  { id: "6", name: "Steel Bowl Set", sku: "ACC-006", price: 85, emoji: "🥣", stock: 18 },
  { id: "7", name: "Pet Bed Large", sku: "BED-007", price: 450, emoji: "🛏️", stock: 5 },
  { id: "8", name: "Shampoo 500ml", sku: "GRM-008", price: 65, emoji: "🧴", stock: 25 },
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  emoji: string;
}

export default function POSPage() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payMethod, setPayMethod] = useState<"cash" | "card">("cash");

  const filtered = DEMO_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(product: (typeof DEMO_PRODUCTS)[0]) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, emoji: product.emoji }];
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
  const tax = subtotal * 0.14; // 14% VAT Egypt
  const total = subtotal + tax;

  async function handleCheckout() {
    if (cart.length === 0) return;
    // TODO: Create invoice in Supabase
    alert(`Invoice created! Total: ${total.toFixed(2)} EGP`);
    setCart([]);
  }

  return (
    <div className="flex gap-4 h-full -m-6 p-6">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="relative mb-4">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product or scan barcode..."
            className="ps-9 bg-white border-paws-sand"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto">
          {filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white border border-paws-sand rounded-2xl p-3 text-start hover:border-paws-orange hover:shadow-sm transition-all active:scale-95"
            >
              <div className="text-3xl mb-1">{product.emoji}</div>
              <p className="text-xs font-semibold text-paws-brown-dark leading-tight line-clamp-2">{product.name}</p>
              <p className="text-paws-orange font-bold text-sm mt-1">{product.price} EGP</p>
              <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-80 shrink-0 flex flex-col bg-white border border-paws-sand rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-paws-sand">
          <h2 className="font-bold text-paws-brown-dark">Current Order</h2>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 mt-0.5"
            >
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              Add products from the left panel
            </p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2 bg-paws-cream/30 rounded-xl p-2">
                <span className="text-xl">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-clamp-1">{item.name}</p>
                  <p className="text-xs text-paws-orange">{item.price} EGP</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="w-6 h-6 rounded-full bg-paws-sand flex items-center justify-center hover:bg-paws-orange hover:text-white transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    className="w-6 h-6 rounded-full bg-paws-sand flex items-center justify-center hover:bg-paws-orange hover:text-white transition-colors"
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

        {/* Totals */}
        <div className="p-4 border-t border-paws-sand space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>VAT (14%)</span>
            <span>{tax.toFixed(2)} EGP</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-paws-brown-dark">
            <span>Total</span>
            <span className="text-paws-orange">{total.toFixed(2)} EGP</span>
          </div>

          {/* Payment Method */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setPayMethod("cash")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors ${payMethod === "cash" ? "bg-paws-orange text-white" : "bg-paws-cream text-paws-brown"}`}
            >
              <Banknote className="w-4 h-4" /> Cash
            </button>
            <button
              onClick={() => setPayMethod("card")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors ${payMethod === "card" ? "bg-paws-orange text-white" : "bg-paws-cream text-paws-brown"}`}
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
