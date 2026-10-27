"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/stores/cart";

type OrderedItem = {
  productId: string;
  variantId: string | null;
  quantity: number;
};
export function PaymentRefresh({
  pending,
  paid,
  items,
  requestId,
}: {
  pending: boolean;
  paid: boolean;
  items: OrderedItem[];
  requestId: string | null;
}) {
  const router = useRouter();
  const t = useTranslations("payment");
  useEffect(() => {
    if (!paid) return;
    try {
      if (
        !requestId ||
        JSON.parse(sessionStorage.getItem("paws-checkout-request") ?? "null")
          ?.id !== requestId
      )
        return;
    } catch {
      return;
    }
    const cart = useCartStore.getState();
    // Keep any cart the customer changed while away at the payment provider.
    if (
      cart.items.length === items.length &&
      cart.items.every((current) =>
        items.some(
          (ordered) =>
            ordered.productId === current.productId &&
            (!current.variantId || ordered.variantId === current.variantId) &&
            ordered.quantity === current.quantity,
        ),
      )
    ) {
      cart.clearCart();
      try {
        sessionStorage.removeItem("paws-checkout-request");
      } catch {}
    }
  }, [paid, items, requestId]);
  useEffect(() => {
    if (!pending) return;
    let attempts = 0;
    const timer = setInterval(() => {
      router.refresh();
      if (++attempts >= 6) clearInterval(timer);
    }, 5000);
    return () => clearInterval(timer);
  }, [pending, router]);
  return pending ? (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="block mt-3 text-sm underline"
    >
      {t("refresh")}
    </button>
  ) : null;
}
