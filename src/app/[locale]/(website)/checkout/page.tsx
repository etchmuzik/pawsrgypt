"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/stores/cart";
import { toast } from "sonner";
import { Loader2, ShoppingBag, Package } from "lucide-react";

export default function CheckoutPage() {
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);

  const subtotal = total();
  const vat = Math.round(subtotal * 0.14);
  const grandTotal = subtotal + vat;

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    area: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    if (!form.phone.trim()) {
      toast.error("Please enter your phone number.");
      return;
    }

    if (!form.street.trim() || !form.city.trim()) {
      toast.error("Please enter your full address.");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setLoading(true);

    const orderData = {
      order_number: "WEB-" + Date.now(),
      customer_name: form.name.trim(),
      customer_email: form.email.trim() || null,
      customer_phone: form.phone.trim(),
      shipping_address: JSON.stringify({
        street: form.street.trim(),
        city: form.city.trim(),
        area: form.area.trim() || null,
      }),
      items: JSON.stringify(
        items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size ?? null,
          color: item.color ?? null,
        }))
      ),
      subtotal,
      shipping: 0,
      total: grandTotal,
      status: "pending",
    };

    const { error } = await supabase
      .from("website_orders")
      .insert(orderData as never);

    setLoading(false);

    if (error) {
      toast.error(error.message ?? "Failed to place order.");
      return;
    }

    useCartStore.getState().clearCart();
    toast.success("Order placed successfully!");
    router.push(`/${locale}/shop`);
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="border-b border-neutral-100">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-10">
            <h1 className="text-3xl font-extrabold text-neutral-900">
              Checkout
            </h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-24 px-4">
          <div className="w-20 h-20 rounded-full bg-neutral-50 flex items-center justify-center mb-6">
            <ShoppingBag className="w-8 h-8 text-neutral-300" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-3">
            Your cart is empty
          </h2>
          <p className="text-neutral-500 mb-8 text-center max-w-md">
            Add some items to your cart before checking out.
          </p>
          <Link
            href={`/${locale}/shop`}
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-full hover:bg-neutral-800 transition-colors font-medium"
          >
            <ShoppingBag className="w-5 h-5" />
            Browse Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-neutral-100">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-10">
          <h1 className="text-3xl font-extrabold text-neutral-900">
            Checkout
          </h1>
          <p className="text-neutral-400 mt-1">
            {items.reduce((sum, i) => sum + i.quantity, 0)} items
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Customer Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-4">
              <h2 className="font-semibold text-neutral-900 text-lg">
                Contact Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="bg-white border-neutral-200"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="01xxxxxxxxx"
                    className="bg-white border-neutral-200"
                    required
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="bg-white border-neutral-200"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-4">
              <h2 className="font-semibold text-neutral-900 text-lg">
                Shipping Address
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    name="street"
                    value={form.street}
                    onChange={handleChange}
                    placeholder="Street name, building number, floor"
                    className="bg-white border-neutral-200"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="e.g. Cairo"
                    className="bg-white border-neutral-200"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="area">Area</Label>
                  <Input
                    id="area"
                    name="area"
                    value={form.area}
                    onChange={handleChange}
                    placeholder="e.g. Maadi, Nasr City"
                    className="bg-white border-neutral-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-50 rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">
                Order Summary
              </h2>

              {/* Items list */}
              <div className="space-y-3 mb-4">
                {items.map((item) => {
                  const isUrl = item.image.startsWith("http");
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-neutral-100">
                        {isUrl ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-neutral-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-neutral-900 shrink-0">
                        {(item.price * item.quantity).toLocaleString()} EGP
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-neutral-200 pt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    {subtotal.toLocaleString()} EGP
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>VAT (14%)</span>
                  <span className="font-medium">
                    {vat.toLocaleString()} EGP
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-neutral-900">
                      Total
                    </span>
                    <span className="text-lg font-extrabold text-paws-orange">
                      {grandTotal.toLocaleString()} EGP
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full mt-6 bg-paws-orange hover:bg-paws-orange/90 text-white gap-2 shadow-[0_8px_30px_rgba(244,124,44,0.25)]"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Placing Order..." : "Place Order"}
              </Button>

              <Link
                href={`/${locale}/cart`}
                className="block text-center text-sm text-neutral-400 hover:text-paws-orange transition-colors mt-4"
              >
                Back to Cart
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
