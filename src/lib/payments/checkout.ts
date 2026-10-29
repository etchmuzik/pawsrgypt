import { z } from "zod";

export const checkoutSchema = z.object({
  request_id: z.string().uuid(),
  locale: z.enum(["en", "ar"]).default("en"),
  payment_method: z.enum(["cod", "fawaterak"]).default("cod"),
  total: z.number().finite().positive(),
  customer_name: z.string().trim().min(1).max(200),
  customer_email: z
    .union([z.email().max(254), z.literal(""), z.null()])
    .optional(),
  customer_phone: z.string().trim().min(6).max(50),
  shipping_address: z.object({
    street: z.string().trim().min(1).max(500),
    city: z.string().trim().min(1).max(100),
    area: z.string().trim().max(100).nullable().optional(),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().nullable().optional(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(100),
});

type CartItem = {
  productId: string;
  variantId?: string | null;
  quantity: number;
  price?: number;
};
export type CatalogProduct = {
  id: string;
  name_en: string;
  delivery_cost?: number;
  is_active: boolean | null;
};
export type CatalogVariant = {
  id: string;
  product_id: string;
  price: number;
  is_active: boolean | null;
  size: string | null;
  color: string | null;
};

export function priceCart(
  cart: CartItem[],
  products: CatalogProduct[],
  variants: CatalogVariant[],
) {
  const items = cart.map((item) => {
    const product = products.find(
      (p) => p.id === item.productId && p.is_active,
    );
    const options = variants.filter(
      (v) => v.product_id === item.productId && v.is_active,
    );
    const variant = item.variantId
      ? options.find((v) => v.id === item.variantId)
      : options.length === 1
        ? options[0]
        : undefined;
    if (
      !product ||
      !variant ||
      !Number.isFinite(Number(variant.price)) ||
      Number(variant.price) <= 0
    ) {
      throw new Error("A product is unavailable. Please refresh your cart.");
    }
    return {
      productId: product.id,
      variantId: variant.id,
      name: product.name_en,
      price: Number(variant.price),
      quantity: item.quantity,
      size: variant.size,
      color: variant.color,
    };
  });
  const subtotal =
    items.reduce(
      (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
      0,
    ) / 100;
  // Preserve the storefront's existing whole-EGP VAT calculation.
  const tax = Math.round(subtotal * 0.14);
  const shipping = [...new Set(items.map(item => item.productId))].reduce((sum, id) => {
    const fee = Number(products.find(product => product.id === id)?.delivery_cost ?? 0);
    if (!Number.isFinite(fee) || fee < 0) throw new Error("Invalid delivery cost");
    return sum + Math.round(fee * 100);
  }, 0) / 100;
  return {
    items,
    subtotal,
    tax,
    shipping,
    total: Math.round((subtotal + tax + shipping) * 100) / 100,
  };
}
