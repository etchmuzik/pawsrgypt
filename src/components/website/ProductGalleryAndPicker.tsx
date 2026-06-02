"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { ProductImageZoom } from "@/components/website/ProductImageZoom";
import {
  VariantPickerAndCart,
  type VariantOption,
} from "@/components/website/VariantPickerAndCart";

interface ProductGalleryAndPickerProps {
  productId: string;
  nameEn: string;
  nameAr: string;
  productImageUrl: string;
  variants: VariantOption[];
  /** Server-rendered info (brand, name, category, rating, description, features). */
  children?: React.ReactNode;
}

/**
 * Spans both PDP columns so the product image (left) and the weight picker
 * (right, below `children`) share "selected variant" state. When the shopper
 * selects a weight, the main image swaps to that weight's image if it has one,
 * else falls back to the product's main image.
 */
export function ProductGalleryAndPicker({
  productId,
  nameEn,
  nameAr,
  productImageUrl,
  variants,
  children,
}: ProductGalleryAndPickerProps) {
  const [variantImage, setVariantImage] = useState<string | null>(null);
  const displayedImage = variantImage ?? (productImageUrl || null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
      {/* Left: image (swaps with selected weight) */}
      <div>
        {displayedImage ? (
          <ProductImageZoom src={displayedImage} alt={nameEn} />
        ) : (
          <div className="bg-neutral-50 rounded-3xl overflow-hidden border border-neutral-100">
            <div className="aspect-square flex items-center justify-center p-8">
              <div className="w-24 h-24 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <Package className="w-10 h-10 text-neutral-300" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: server info + picker */}
      <div className="flex flex-col gap-5">
        {children}
        <VariantPickerAndCart
          productId={productId}
          nameEn={nameEn}
          nameAr={nameAr}
          imageUrl={productImageUrl}
          variants={variants}
          onVariantChange={(v) => setVariantImage(v.image_url ?? null)}
        />
      </div>
    </div>
  );
}
