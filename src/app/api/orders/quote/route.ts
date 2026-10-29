import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSchema, priceCart, type CatalogProduct, type CatalogVariant } from "@/lib/payments/checkout";
const schema = checkoutSchema.pick({ items: true });
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({error: "Invalid cart"}, {status:400});
    const client = createAdminClient();
    const ids = [...new Set(parsed.data.items.map(item => item.productId))];
    const [products, variants] = await Promise.all([
      client.from("products").select("id,name_en,is_active,delivery_cost").in("id",ids),
      client.from("product_variants").select("id,product_id,price,is_active,size,color").in("product_id",ids)
    ]);
    if (products.error || variants.error) throw new Error("Catalog unavailable");
    const quote = priceCart(parsed.data.items, products.data as CatalogProduct[], variants.data as CatalogVariant[]);
    return NextResponse.json({subtotal:quote.subtotal,tax:quote.tax,shipping:quote.shipping,total:quote.total},{headers:{"Cache-Control":"no-store"}});
  } catch { return NextResponse.json({error:"Unable to price cart. Please refresh."},{status:400}); }
}
