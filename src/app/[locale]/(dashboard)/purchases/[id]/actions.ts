"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

interface PurchaseItemRow {
  product_id: string;
  variant_id: string | null;
  quantity: number;
}

interface StockRow {
  id: string;
  quantity: number;
}

export async function markPurchaseOrderReceived(orderId: string): Promise<ActionResult> {
  if (!orderId) return { success: false, error: "Missing order id" };

  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: order, error: orderErr } = await supabase
    .from("purchase_orders")
    .select("id, status, branch_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr || !order) {
    return { success: false, error: orderErr?.message ?? "Order not found" };
  }

  const o = order as { id: string; status: string; branch_id: string };

  if (o.status === "received") {
    return { success: false, error: "Order is already received" };
  }
  if (o.status === "cancelled") {
    return { success: false, error: "Cannot receive a cancelled order" };
  }

  const { data: warehouses, error: whErr } = await supabase
    .from("warehouses")
    .select("id")
    .eq("branch_id", o.branch_id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1);

  if (whErr) return { success: false, error: whErr.message };
  const warehouseId = (warehouses as Array<{ id: string }> | null)?.[0]?.id;
  if (!warehouseId) {
    return { success: false, error: "No active warehouse for this branch" };
  }

  const { data: itemsRaw, error: itemsErr } = await supabase
    .from("purchase_items")
    .select("product_id, variant_id, quantity")
    .eq("order_id", orderId);

  if (itemsErr) return { success: false, error: itemsErr.message };
  const items = (itemsRaw as PurchaseItemRow[] | null) ?? [];

  for (const line of items) {
    const qty = Number(line.quantity) || 0;
    if (qty <= 0) continue;

    let stockQuery = supabase
      .from("stock")
      .select("id, quantity")
      .eq("product_id", line.product_id)
      .eq("warehouse_id", warehouseId);
    stockQuery = line.variant_id
      ? stockQuery.eq("variant_id", line.variant_id)
      : stockQuery.is("variant_id", null);

    const { data: stockRows, error: stockErr } = await stockQuery.limit(1);
    if (stockErr) return { success: false, error: stockErr.message };

    const existing = (stockRows as StockRow[] | null)?.[0];

    if (existing) {
      const { error: updErr } = await supabase
        .from("stock")
        .update({ quantity: Number(existing.quantity) + qty, updated_at: new Date().toISOString() } as never)
        .eq("id", existing.id);
      if (updErr) return { success: false, error: updErr.message };
    } else {
      const { error: insErr } = await supabase.from("stock").insert({
        product_id: line.product_id,
        variant_id: line.variant_id,
        warehouse_id: warehouseId,
        quantity: qty,
      } as never);
      if (insErr) return { success: false, error: insErr.message };
    }

    const { error: mvErr } = await supabase.from("stock_movements").insert({
      type: "in",
      product_id: line.product_id,
      variant_id: line.variant_id,
      quantity: qty,
      to_warehouse_id: warehouseId,
      reference_type: "purchase_order",
      reference_id: orderId,
      notes: "PO received",
      created_by: user.id,
    } as never);
    if (mvErr) return { success: false, error: mvErr.message };
  }

  const { error: statusErr } = await supabase
    .from("purchase_orders")
    .update({ status: "received", received_at: new Date().toISOString() } as never)
    .eq("id", orderId);

  if (statusErr) return { success: false, error: statusErr.message };

  // Fan out stock-alert emails for each product that was received.
  // Non-blocking on individual failures so the whole receive flow succeeds
  // even if an email provider hiccups.
  const productIds = Array.from(new Set(items.map((l) => l.product_id).filter(Boolean)));
  if (productIds.length > 0) {
    await notifyStockAlerts(productIds);
  }

  revalidatePath(`/[locale]/(dashboard)/purchases/${orderId}`, "page");
  revalidatePath(`/[locale]/(dashboard)/purchases`, "page");
  revalidatePath(`/[locale]/(dashboard)/inventory`, "page");
  return { success: true };
}

interface PendingAlert {
  id: string;
  email: string;
  product_id: string;
  products: { name_en: string } | null;
}

async function notifyStockAlerts(productIds: string[]): Promise<void> {
  const supabase = await createClient();

  const { data: alertsData } = await supabase
    .from("stock_alerts")
    .select("id, email, product_id, products(name_en)")
    .in("product_id", productIds)
    .eq("status", "pending");

  const alerts = (alertsData as unknown as PendingAlert[] | null) ?? [];
  if (alerts.length === 0) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pawsegypt.com";

  for (const alert of alerts) {
    const productName = alert.products?.name_en ?? "your product";
    const productUrl = `${siteUrl}/en/shop/${alert.product_id}`;

    const html = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color:#1f2937; margin:0 0 16px;">Good news — it's back in stock!</h2>
        <p style="color:#4b5563; line-height:1.6;">
          <strong>${productName}</strong> is available again at PAWS Egypt. Grab yours before it sells out.
        </p>
        <p style="margin: 24px 0;">
          <a href="${productUrl}"
             style="display:inline-block; background:#F97316; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
            Shop now
          </a>
        </p>
        <p style="color:#9ca3af; font-size:13px; margin-top:32px;">
          You're receiving this because you asked to be notified when this item came back in stock.
          No further action is needed — this alert closes automatically.
        </p>
      </div>
    `;

    const result = await sendEmail({
      to: alert.email,
      subject: `${productName} is back in stock`,
      html,
    });

    if (result.ok) {
      await supabase
        .from("stock_alerts")
        .update({
          status: "notified",
          notified_at: new Date().toISOString(),
        } as never)
        .eq("id", alert.id);
    }
  }
}

export async function cancelPurchaseOrder(orderId: string): Promise<ActionResult> {
  if (!orderId) return { success: false, error: "Missing order id" };

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("purchase_orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();

  const current = (order as { status: string } | null)?.status;
  if (!current) return { success: false, error: "Order not found" };
  if (current === "received") {
    return { success: false, error: "Cannot cancel a received order" };
  }
  if (current === "cancelled") return { success: true };

  const { error } = await supabase
    .from("purchase_orders")
    .update({ status: "cancelled" } as never)
    .eq("id", orderId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/[locale]/(dashboard)/purchases/${orderId}`, "page");
  revalidatePath(`/[locale]/(dashboard)/purchases`, "page");
  return { success: true };
}

interface PurchaseLineInput {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_cost: number;
}

interface UpdatePurchaseOrderInput {
  supplier_id: string;
  branch_id: string;
  notes: string | null;
  discount: number;
  tax_rate: number;
  lines: PurchaseLineInput[];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function updatePurchaseOrder(orderId: string, input: UpdatePurchaseOrderInput): Promise<ActionResult> {
  if (!orderId) return { success: false, error: "Missing order id" };
  if (!input.supplier_id) return { success: false, error: "Supplier is required" };
  if (!input.branch_id) return { success: false, error: "Branch is required" };
  if (!input.lines.length) return { success: false, error: "At least one line is required" };

  for (const line of input.lines) {
    if (!line.product_id) return { success: false, error: "Every line needs a product" };
    const qty = Number(line.quantity);
    const cost = Number(line.unit_cost);
    if (!qty || qty <= 0) return { success: false, error: "Quantity must be greater than zero" };
    if (cost < 0) return { success: false, error: "Unit cost cannot be negative" };
  }

  const supabase = await createClient();

  const { data: currentData, error: fetchErr } = await supabase
    .from("purchase_orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();
  if (fetchErr) return { success: false, error: fetchErr.message };
  const current = (currentData as { status: string } | null)?.status;
  if (!current) return { success: false, error: "Order not found" };
  if (current !== "draft") {
    return { success: false, error: `Only draft orders can be edited (current: ${current})` };
  }

  const subtotal = input.lines.reduce((s, l) => s + Number(l.quantity) * Number(l.unit_cost), 0);
  const discount = Number(input.discount) || 0;
  const taxable = Math.max(0, subtotal - discount);
  const taxRate = Number(input.tax_rate) || 0;
  const taxAmount = round2(taxable * (taxRate / 100));
  const total = round2(taxable + taxAmount);

  const { error: headerErr } = await supabase
    .from("purchase_orders")
    .update({
      supplier_id: input.supplier_id,
      branch_id: input.branch_id,
      notes: input.notes?.trim() || null,
      discount,
      subtotal: round2(subtotal),
      tax_amount: taxAmount,
      total,
    } as never)
    .eq("id", orderId);
  if (headerErr) return { success: false, error: headerErr.message };

  const { error: delErr } = await supabase.from("purchase_items").delete().eq("order_id", orderId);
  if (delErr) return { success: false, error: delErr.message };

  const lineRows = input.lines.map((l) => {
    const lineTotal = round2(Number(l.quantity) * Number(l.unit_cost));
    return {
      order_id: orderId,
      product_id: l.product_id,
      variant_id: l.variant_id,
      quantity: Number(l.quantity),
      unit_cost: Number(l.unit_cost),
      total: lineTotal,
    };
  });
  const { error: insErr } = await supabase.from("purchase_items").insert(lineRows as never);
  if (insErr) return { success: false, error: insErr.message };

  revalidatePath(`/[locale]/(dashboard)/purchases/${orderId}`, "page");
  revalidatePath(`/[locale]/(dashboard)/purchases`, "page");
  return { success: true, id: orderId };
}

export async function markPurchaseOrderOrdered(orderId: string): Promise<ActionResult> {
  if (!orderId) return { success: false, error: "Missing order id" };

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("purchase_orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();

  const current = (order as { status: string } | null)?.status;
  if (!current) return { success: false, error: "Order not found" };
  if (current !== "draft") {
    return { success: false, error: `Cannot mark ordered from status "${current}"` };
  }

  const { error } = await supabase
    .from("purchase_orders")
    .update({ status: "ordered", ordered_at: new Date().toISOString() } as never)
    .eq("id", orderId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/[locale]/(dashboard)/purchases/${orderId}`, "page");
  revalidatePath(`/[locale]/(dashboard)/purchases`, "page");
  return { success: true };
}
