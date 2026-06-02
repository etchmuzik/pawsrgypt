"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AddToCartButton } from "./AddToCartButton";
import { NotifyWhenAvailable } from "./NotifyWhenAvailable";

export interface VariantOption {
  id: string;
  size: string | null;
  weight: number | null;
  color: string | null;
  price: number;
  quantity: number;
  image_url: string | null;
}

interface VariantPickerAndCartProps {
  productId: string;
  nameEn: string;
  nameAr: string;
  imageUrl: string;
  variants: VariantOption[];
  onVariantChange?: (variant: VariantOption) => void;
}

function variantLabel(v: VariantOption, isAr: boolean): string {
  const parts: string[] = [];
  if (v.size) parts.push(v.size);
  else if (v.weight != null) parts.push(`${v.weight} ${isAr ? "كجم" : "kg"}`);
  if (v.color) parts.push(v.color);
  return parts.join(" · ");
}

export function VariantPickerAndCart({
  productId,
  nameEn,
  nameAr,
  imageUrl,
  variants,
  onVariantChange,
}: VariantPickerAndCartProps) {
  const locale = useLocale();
  const tc = useTranslations("common");
  const t = useTranslations("product");
  const isAr = locale === "ar";

  const sizeOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of variants) {
      const key = v.size ?? (v.weight != null ? `${v.weight}${isAr ? "كجم" : "kg"}` : null);
      if (key && !seen.has(key)) {
        seen.add(key);
        out.push(key);
      }
    }
    return out;
  }, [variants, isAr]);

  const colorOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of variants) {
      if (v.color && !seen.has(v.color)) {
        seen.add(v.color);
        out.push(v.color);
      }
    }
    return out;
  }, [variants]);

  function variantSizeKey(v: VariantOption): string | null {
    return v.size ?? (v.weight != null ? `${v.weight}${isAr ? "كجم" : "kg"}` : null);
  }

  function findVariant(size: string | null, color: string | null): VariantOption | null {
    return (
      variants.find(
        (v) =>
          (size === null || variantSizeKey(v) === size) &&
          (color === null || v.color === color)
      ) ?? null
    );
  }

  function pickInitial(): VariantOption {
    const inStock = variants.filter((v) => v.quantity > 0);
    const pool = inStock.length > 0 ? inStock : variants;
    return pool.reduce((cheapest, v) => (v.price < cheapest.price ? v : cheapest), pool[0]);
  }

  const [selected, setSelected] = useState<VariantOption>(pickInitial);

  function selectVariant(next: VariantOption) {
    setSelected(next);
    onVariantChange?.(next);
  }

  // Notify the parent of the INITIAL selection exactly once on mount.
  // Subsequent changes are pushed explicitly from the selection handlers below.
  const notifiedInitial = useRef(false);
  useEffect(() => {
    if (notifiedInitial.current) return;
    notifiedInitial.current = true;
    onVariantChange?.(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedSizeKey = variantSizeKey(selected);
  const selectedColor = selected.color;
  const outOfStock = selected.quantity <= 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Price */}
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-extrabold text-neutral-900">
          {selected.price.toLocaleString()}
        </span>
        <span className="text-lg text-neutral-400 font-medium">{tc("egp")}</span>
      </div>

      {/* Stock status */}
      {outOfStock ? (
        <div className="flex items-center gap-2 text-red-600">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-sm font-medium">{t("out_of_stock")}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-emerald-600">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-sm font-medium">{t("in_stock")}</span>
        </div>
      )}

      {/* Size / weight picker */}
      {sizeOptions.length > 1 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-neutral-700">
            {isAr ? "الحجم" : "Size"}
          </p>
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((opt) => {
              const candidate = findVariant(opt, selectedColor);
              const disabled = !candidate || candidate.quantity <= 0;
              const active = selectedSizeKey === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    const next = findVariant(opt, selectedColor) ?? findVariant(opt, null);
                    if (next) selectVariant(next);
                  }}
                  className={[
                    "px-4 py-2 rounded-full border text-sm font-semibold transition-all",
                    active
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900",
                    disabled ? "opacity-50 line-through" : "",
                  ].join(" ")}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color / flavor picker */}
      {colorOptions.length > 1 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-neutral-700">
            {isAr ? "النكهة" : "Flavor"}
          </p>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((opt) => {
              const candidate = findVariant(selectedSizeKey, opt);
              const disabled = !candidate || candidate.quantity <= 0;
              const active = selectedColor === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    const next = findVariant(selectedSizeKey, opt) ?? findVariant(null, opt);
                    if (next) selectVariant(next);
                  }}
                  className={[
                    "px-4 py-2 rounded-full border text-sm font-semibold transition-all",
                    active
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900",
                    disabled ? "opacity-50 line-through" : "",
                  ].join(" ")}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action */}
      <div className="flex gap-3 pt-2">
        {outOfStock ? (
          <NotifyWhenAvailable
            productId={productId}
            variantId={selected.id}
            size="lg"
            className="flex-1"
          />
        ) : (
          <AddToCartButton
            id={productId}
            name={nameEn}
            nameAr={nameAr}
            price={selected.price}
            image={imageUrl}
            variantId={selected.id}
            variantLabel={variantLabel(selected, isAr)}
            size="lg"
            className="flex-1"
          />
        )}
      </div>
    </div>
  );
}
