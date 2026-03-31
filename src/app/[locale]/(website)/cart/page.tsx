"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart";
import { ScrollReveal } from "@/components/website/ScrollReveal";

export default function CartPage() {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const locale = useLocale();

  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = useCartStore((s) => s.total);

  const subtotal = total();
  const vat = Math.round(subtotal * 0.14);
  const grandTotal = subtotal + vat;

  const BackArrow = locale === "ar" ? ArrowRight : ArrowLeft;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="border-b border-neutral-100">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-10">
            <h1 className="text-3xl font-extrabold text-neutral-900">{t("title")}</h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-24 px-4">
          <div className="w-20 h-20 rounded-full bg-neutral-50 flex items-center justify-center mb-6">
            <ShoppingBag className="w-8 h-8 text-neutral-300" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-3">
            {t("empty")}
          </h2>
          <p className="text-neutral-500 mb-8 text-center max-w-md">
            {t("empty_desc")}
          </p>
          <Link
            href={`/${locale}/shop`}
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-full hover:bg-neutral-800 transition-colors font-medium"
          >
            <ShoppingBag className="w-5 h-5" />
            {t("continue_shopping")}
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
          <h1 className="text-3xl font-extrabold text-neutral-900">{t("title")}</h1>
          <p className="text-neutral-400 mt-1">
            {items.reduce((sum, i) => sum + i.quantity, 0)} {t("items")}
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8">
        {/* Back to shop */}
        <Link
          href={`/${locale}/shop`}
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-paws-orange transition-colors mb-6"
        >
          <BackArrow className="w-4 h-4" />
          {t("continue_shopping")}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const isUrl = item.image.startsWith("http");
              return (
                <ScrollReveal key={item.id}>
                  <div className="bg-white border border-neutral-100 rounded-2xl p-4 md:p-6 flex gap-4">
                    {/* Product image */}
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-neutral-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                      {isUrl ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-neutral-300" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-neutral-900 text-sm md:text-base line-clamp-2">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-neutral-400 hover:text-red-500 transition-colors shrink-0 p-1"
                          aria-label={t("remove")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-1 text-sm text-paws-orange font-bold">
                        {item.price.toLocaleString()} {tc("egp")}
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center font-medium text-sm text-neutral-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="font-bold text-neutral-900 text-sm md:text-base">
                          {(item.price * item.quantity).toLocaleString()} {tc("egp")}
                        </span>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}

            {/* Clear Cart */}
            <div className="flex justify-end">
              <button
                onClick={clearCart}
                className="text-sm text-neutral-400 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t("clear_cart")}
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <ScrollReveal delay={100}>
              <div className="bg-neutral-50 rounded-2xl p-6 sticky top-24">
                <h2 className="text-lg font-bold text-neutral-900 mb-4">
                  {t("title")}
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-neutral-600">
                    <span>{t("subtotal")}</span>
                    <span className="font-medium">
                      {subtotal.toLocaleString()} {tc("egp")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600">
                    <span>{t("vat")}</span>
                    <span className="font-medium">
                      {vat.toLocaleString()} {tc("egp")}
                    </span>
                  </div>
                  <div className="border-t border-neutral-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-neutral-900">{t("total")}</span>
                      <span className="text-lg font-extrabold text-paws-orange">
                        {grandTotal.toLocaleString()} {tc("egp")}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full mt-6 bg-paws-orange hover:bg-paws-orange/90 text-white gap-2 shadow-[0_8px_30px_rgba(244,124,44,0.25)]"
                >
                  {t("checkout")}
                </Button>

                <Link
                  href={`/${locale}/shop`}
                  className="block text-center text-sm text-neutral-400 hover:text-paws-orange transition-colors mt-4"
                >
                  {t("continue_shopping")}
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}
