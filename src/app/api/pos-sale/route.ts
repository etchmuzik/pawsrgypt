import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

interface PosSaleLine {
  productId: string;
  variantId: string;
  quantity: number;
}

interface PosSaleBody {
  invoiceId: string;
  warehouseId: string;
  userId: string;
  lines: PosSaleLine[];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  let body: PosSaleBody;
  try {
    body = (await req.json()) as PosSaleBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { invoiceId, warehouseId, userId, lines } = body;
  if (!invoiceId || !UUID_RE.test(invoiceId)) {
    return NextResponse.json({ ok: false, error: "Valid invoiceId required" }, { status: 400 });
  }
  if (!warehouseId || !UUID_RE.test(warehouseId)) {
    return NextResponse.json({ ok: false, error: "Valid warehouseId required" }, { status: 400 });
  }
  if (!userId || !UUID_RE.test(userId)) {
    return NextResponse.json({ ok: false, error: "Valid userId required" }, { status: 400 });
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ ok: false, error: "lines required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const warnings: string[] = [];
  let decremented = 0;
  let movements = 0;

  for (const line of lines) {
    const productId = line.productId;
    const variantId = line.variantId;
    const qty = Number(line.quantity);
    if (!UUID_RE.test(productId) || !UUID_RE.test(variantId) || !(qty > 0)) {
      warnings.push(`Skipped invalid line ${productId}/${variantId}`);
      continue;
    }

    // Prefer the variant-keyed stock row; fall back to a legacy null-variant row
    // for products whose stock predates the variant model.
    let { data: stockRow } = await admin
      .from("stock")
      .select("id, quantity")
      .eq("product_id", productId)
      .eq("variant_id", variantId)
      .eq("warehouse_id", warehouseId)
      .maybeSingle();

    if (!stockRow) {
      const fallback = await admin
        .from("stock")
        .select("id, quantity")
        .eq("product_id", productId)
        .is("variant_id", null)
        .eq("warehouse_id", warehouseId)
        .maybeSingle();
      stockRow = fallback.data;
    }

    const row = stockRow as { id: string; quantity: number } | null;
    if (row) {
      const newQty = Math.max(0, Number(row.quantity) - qty);
      const upd = await admin
        .from("stock")
        .update({ quantity: newQty, updated_at: new Date().toISOString() } as never)
        .eq("id", row.id);
      if (upd.error) warnings.push(`Stock ${productId}: ${upd.error.message}`);
      else decremented += 1;
    } else {
      warnings.push(`No stock row for ${productId}/${variantId} at warehouse`);
    }

    const mov = await admin.from("stock_movements").insert({
      type: "out",
      product_id: productId,
      variant_id: variantId,
      quantity: qty,
      from_warehouse_id: warehouseId,
      reference_type: "pos_sale",
      reference_id: invoiceId,
      notes: "POS sale",
      created_by: userId,
    } as never);
    if (mov.error) warnings.push(`Movement ${productId}: ${mov.error.message}`);
    else movements += 1;
  }

  return NextResponse.json({ ok: true, decremented, movements, warnings });
}
