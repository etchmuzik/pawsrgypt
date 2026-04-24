import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface StockAlertInput {
  productId?: string;
  variantId?: string | null;
  email?: string;
  phone?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: StockAlertInput;
  try {
    body = (await request.json()) as StockAlertInput;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const productId = body.productId?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.trim() || null;
  const variantId = body.variantId?.trim() || null;

  if (!productId) {
    return NextResponse.json({ ok: false, error: "productId is required" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Valid email is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("stock_alerts")
    .upsert(
      {
        product_id: productId,
        variant_id: variantId,
        email,
        phone,
        status: "pending",
      } as never,
      { onConflict: "product_id,email", ignoreDuplicates: false },
    );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
