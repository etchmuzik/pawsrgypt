"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart";

interface AddToCartButtonProps {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  image: string;
  variantId?: string | null;
  variantLabel?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline";
  className?: string;
}

export function AddToCartButton({
  id,
  name,
  nameAr,
  price,
  image,
  variantId = null,
  variantLabel,
  size = "lg",
  variant = "default",
  className = "",
}: AddToCartButtonProps) {
  const t = useTranslations("product");
  const locale = useLocale();
  const addItem = useCartStore((s) => s.addItem);

  function handleAdd() {
    addItem({
      productId: id,
      variantId,
      name: locale === "ar" ? nameAr : name,
      image,
      price,
      size: variantLabel,
    });

    const displayName = locale === "ar" ? nameAr : name;
    const description = variantLabel ? `${displayName} · ${variantLabel}` : displayName;
    toast.success(t("added_to_cart"), {
      description,
    });
  }

  return (
    <Button
      onClick={handleAdd}
      size={size}
      variant={variant}
      className={`gap-2 ${
        variant === "default"
          ? "bg-paws-orange hover:bg-paws-orange/90 text-white shadow-[0_8px_30px_rgba(244,124,44,0.25)] hover:shadow-[0_12px_40px_rgba(244,124,44,0.35)] transition-all hover:scale-[1.02]"
          : "border-paws-orange text-paws-orange hover:bg-paws-orange hover:text-white"
      } ${className}`}
    >
      <ShoppingCart className="w-5 h-5" />
      {t("add_to_cart")}
    </Button>
  );
}
