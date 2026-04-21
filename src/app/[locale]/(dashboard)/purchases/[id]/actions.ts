"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface ActionResult {
  success: boolean;
  error?: string;
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

  revalidatePath(`/[locale]/(dashboard)/purchases/${orderId}`, "page");
  revalidatePath(`/[locale]/(dashboard)/purchases`, "page");
  revalidatePath(`/[locale]/(dashboard)/inventory`, "page");
  return { success: true };
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
