import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DashboardWebsiteOrder, WebsitePayment } from "./summary";

type OrderRow = Omit<DashboardWebsiteOrder, "payment">;

export async function loadDashboardWebsiteOrders(): Promise<{ authorized: boolean; orders: DashboardWebsiteOrder[] }> {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { authorized: false, orders: [] };
  const { data: profileRow } = await client.from("profiles").select("role, is_active").eq("id", user.id).single();
  const profile = profileRow as { role: string; is_active: boolean } | null;
  if (!profile?.is_active || !["admin", "manager", "cashier"].includes(profile.role)) return { authorized: false, orders: [] };

  // Keep staff order visibility under the existing authenticated SELECT policy.
  // Only payment metadata for those visible orders is read with the server key.
  const rows: OrderRow[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from("website_orders")
      .select("id, order_number, customer_name, customer_email, customer_phone, shipping_address, items, subtotal, shipping, total, status, notes, created_at")
      .order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
    if (error) throw new Error("Website orders could not be loaded.");
    rows.push(...((data as unknown as OrderRow[] | null) ?? []));
    if ((data?.length ?? 0) < 500) break;
  }
  if (!rows.length) return { authorized: true, orders: [] };
  const admin = createAdminClient();
  const payments = new Map<string, WebsitePayment>();
  for (let offset = 0; offset < rows.length; offset += 100) {
    const { data, error } = await admin.from("website_order_payments" as never)
      .select("order_id, method, status, amount, currency, environment, paid_at")
      .in("order_id", rows.slice(offset, offset + 100).map((row) => row.id));
    if (error) throw new Error("Website payment status could not be loaded.");
    for (const payment of (data ?? []) as unknown as (WebsitePayment & { order_id: string })[]) {
      const { order_id, ...metadata } = payment;
      payments.set(order_id, metadata);
    }
  }
  return { authorized: true, orders: rows.map((order) => ({ ...order, payment: payments.get(order.id) ?? null })) };
}
