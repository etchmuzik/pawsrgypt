"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/stores/cart";
import { toast } from "sonner";
import { Loader2, ShoppingBag, Package } from "lucide-react";

export default function CheckoutPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("payment");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "fawaterak">("cod");
  const [online, setOnline] = useState({ available: false, test_mode: false });
  useEffect(() => {
    fetch("/api/payments/fawaterak").then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setOnline(data); }).catch(() => {});
  }, []);

  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);

  const cartSubtotal = total();
  const [quote, setQuote] = useState<{subtotal:number;tax:number;shipping:number;total:number;key:string}|null>(null);
  const cartKey = JSON.stringify(items.map(({productId,variantId,quantity}) => ({productId,variantId,quantity})));
  const currentQuote = quote?.key === cartKey ? quote : null;
  const subtotal = currentQuote?.subtotal ?? cartSubtotal;
  const vat = currentQuote?.tax ?? Math.round(subtotal * 0.14);
  useEffect(() => {
    const controller = new AbortController();
    setQuote(null);
    if (items.length) fetch("/api/orders/quote", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:JSON.parse(cartKey)}),signal:controller.signal})
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => setQuote({...data,key:cartKey})).catch(() => {});
    return () => controller.abort();
  }, [cartKey]);
  const shipping = currentQuote?.shipping ?? 0;
  const grandTotal = currentQuote?.total ?? subtotal + vat;

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

    if (!currentQuote) { toast.error("Delivery cost is still loading. Please refresh if it does not load."); return; }
    setLoading(true);

    try {
      const fingerprint = JSON.stringify({ form, paymentMethod, total: grandTotal, items: items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })) });
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fingerprint));
      const signature = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
      let requestId = crypto.randomUUID();
      try {
        const saved = JSON.parse(sessionStorage.getItem("paws-checkout-request") ?? "null");
        if (saved?.signature === signature && typeof saved.id === "string") requestId = saved.id;
        sessionStorage.setItem("paws-checkout-request", JSON.stringify({ signature, id: requestId }));
      } catch { /* Checkout also works when session storage is unavailable. */ }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          locale,
          payment_method: paymentMethod,
          customer_name: form.name.trim(),
          customer_email: form.email.trim() || null,
          customer_phone: form.phone.trim(),
          shipping_address: {
            street: form.street.trim(),
            city: form.city.trim(),
            area: form.area.trim() || null,
          },
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size ?? null,
            color: item.color ?? null,
          })),
          subtotal,
          shipping,
          total: grandTotal,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? "Failed to place order.");
        setLoading(false);
        return;
      }

      const { access_token, payment_url } = (await res.json()) as {
        access_token: string;
        order_number: string;
        payment_url: string | null;
      };

      if (payment_url) {
        window.location.assign(payment_url);
        return;
      }
      if (paymentMethod === "cod") {
        useCartStore.getState().clearCart();
        try { sessionStorage.removeItem("paws-checkout-request"); } catch {}
        toast.success("Order placed successfully!");
      }
      router.push(`/${locale}/orders/${access_token}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      toast.error(message);
      setLoading(false);
    }
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
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            Checkout
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            {items.reduce((sum, i) => sum + i.quantity, 0)} items
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {/* Customer Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Contact */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-4 sm:p-6 space-y-4">
              <h2 className="font-semibold text-neutral-900 text-base sm:text-lg">
                Contact Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="bg-white border-neutral-200 h-11"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="01xxxxxxxxx"
                    className="bg-white border-neutral-200 h-11"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="bg-white border-neutral-200 h-11"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-4 sm:p-6 space-y-4">
              <h2 className="font-semibold text-neutral-900 text-base sm:text-lg">
                Shipping Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    name="street"
                    autoComplete="street-address"
                    value={form.street}
                    onChange={handleChange}
                    placeholder="Street name, building number, floor"
                    className="bg-white border-neutral-200 h-11"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="e.g. Cairo"
                    className="bg-white border-neutral-200 h-11"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="area">Area</Label>
                  <Input
                    id="area"
                    name="area"
                    autoComplete="address-level3"
                    value={form.area}
                    onChange={handleChange}
                    placeholder="e.g. Maadi, Nasr City"
                    className="bg-white border-neutral-200 h-11"
                  />
                </div>
              </div>
            </div>
            <fieldset className="bg-white rounded-2xl border border-neutral-100 p-4 sm:p-6 space-y-4">
              <legend className="px-1 font-semibold text-neutral-900">{t("title")}</legend>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="payment_method" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="mt-1 accent-orange-500" />
                <span><span className="block font-medium">{t("cod")}</span><span className="text-sm text-neutral-500">{t("codDescription")}</span></span>
              </label>
              {online.available && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="payment_method" value="fawaterak" checked={paymentMethod === "fawaterak"} onChange={() => setPaymentMethod("fawaterak")} className="mt-1 accent-orange-500" />
                  <span><span className="block font-medium">{t("online")}</span><span className="text-sm text-neutral-500">{t("onlineDescription")}</span>{online.test_mode && <span className="block text-xs text-amber-700 mt-1">{t("testMode")}</span>}</span>
                </label>
              )}
            </fieldset>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-50 rounded-2xl p-4 sm:p-6 lg:sticky lg:top-24">
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
                  <span className="font-medium">{currentQuote ? (shipping ? `${shipping.toLocaleString()} EGP` : "Free") : "Calculating…"}</span>
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
                {loading ? t("preparing") : paymentMethod === "fawaterak" ? t("continue") : "Place Order"}
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
