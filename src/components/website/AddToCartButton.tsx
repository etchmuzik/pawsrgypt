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
  emoji: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline";
  className?: string;
}

export function AddToCartButton({
  id,
  name,
  nameAr,
  price,
  emoji,
  size = "lg",
  variant = "default",
  className = "",
}: AddToCartButtonProps) {
  const t = useTranslations("product");
  const locale = useLocale();
  const addItem = useCartStore((s) => s.addItem);

  function handleAdd() {
    addItem({
      id,
      productId: id,
      variantId: null,
      name: locale === "ar" ? nameAr : name,
      image: emoji,
      price,
    });

    const displayName = locale === "ar" ? nameAr : name;
    toast.success(t("added_to_cart"), {
      description: displayName,
    });
  }

  return (
    <Button
      onClick={handleAdd}
      size={size}
      variant={variant}
      className={`gap-2 ${
        variant === "default"
          ? "bg-paws-orange hover:bg-paws-orange/90 text-white"
          : "border-paws-orange text-paws-orange hover:bg-paws-orange hover:text-white"
      } ${className}`}
    >
      <ShoppingCart className="w-5 h-5" />
      {t("add_to_cart")}
    </Button>
  );
}
