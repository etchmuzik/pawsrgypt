import {OrderStatusControls} from "@/components/dashboard/OrderStatusControls";
import {createClient} from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDashboardWebsiteOrders } from "@/lib/orders/server";
import { isTestOrder } from "@/lib/orders/summary";
import { fulfillmentLabel, websitePaymentMethod, WebsiteOrderStatus } from "@/components/dashboard/WebsiteOrderStatus";

export const dynamic = "force-dynamic";

function text(value: unknown) { return typeof value === "string" || typeof value === "number" ? String(value) : ""; }
function record(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }

export default async function WebsiteOrderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const ar = locale === "ar";
  const { authorized, orders } = await loadDashboardWebsiteOrders();
  if (!authorized) return <p>{ar ? "ليس لديك صلاحية عرض طلبات الموقع." : "You do not have access to website orders."}</p>;
  const order = orders.find((row) => row.id === id);
  if (!order) notFound();
  const client = await createClient();
  const {data: history} = await client.from("website_order_status_history" as never).select("id,from_status,to_status,actor_id,created_at,actor:profiles!actor_id(full_name)").eq("order_id",id).order("created_at",{ascending:false});
  const events = (history ?? []) as {id:string;from_status:string;to_status:string;actor_id:string;created_at:string;actor:{full_name:string|null}|null}[];
  const address = record(order.shipping_address);
  const items = Array.isArray(order.items) ? order.items.map(record) : [];
  const money = (value: number) => `${Number(value).toLocaleString(ar ? "ar-EG" : "en-EG", { maximumFractionDigits: 2 })} ${ar ? "ج.م" : "EGP"}`;
  return <div className="max-w-5xl">
    <Link href={`/${locale}/dashboard/orders`} className="text-sm font-medium text-paws-orange hover:underline">{ar ? "العودة لطلبات الموقع" : "Back to website orders"}</Link>
    <h1 className="text-2xl font-bold text-neutral-900 mt-4 break-all">{order.order_number}</h1>
    {isTestOrder(order) && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-amber-800 font-semibold">{ar ? "طلب تجريبي — لا يتم شحنه أو تنفيذه." : "Test order — do not ship or fulfill."}</p>}
    <OrderStatusControls id={id} status={order.status} locale={locale} blocked={isTestOrder(order) || (order.payment?.method === "fawaterak" && order.payment.status !== "paid")} />
    <section className="my-5"><h2 className="font-semibold">{ar?"سجل الحالات":"Status history"}</h2>{events.map(event=><p key={event.id} className="text-xs text-muted-foreground mt-2">{fulfillmentLabel(event.from_status,locale)} → {fulfillmentLabel(event.to_status,locale)} · {new Date(event.created_at).toLocaleString(ar?"ar-EG":"en-EG",{timeZone:"Africa/Cairo"})} · {event.actor?.full_name || event.actor_id}</p>)}</section>
    <div className="grid md:grid-cols-2 gap-5 mt-6">
      <section className="rounded-2xl border bg-white p-5 space-y-2"><h2 className="font-semibold mb-3">{ar ? "العميل والتوصيل" : "Customer and delivery"}</h2><p>{order.customer_name}</p><p dir="ltr">{order.customer_phone}</p><p dir="ltr">{order.customer_email}</p><p>{[address.street, address.area, address.city].map(text).filter(Boolean).join(", ")}</p><p className="text-sm text-muted-foreground">{ar ? "حالة الطلب: " : "Fulfillment: "}{fulfillmentLabel(order.status, locale)}</p><p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString(ar ? "ar-EG" : "en-EG", { timeZone: "Africa/Cairo" })}</p></section>
      <section className="rounded-2xl border bg-white p-5 space-y-3"><h2 className="font-semibold">{ar ? "الدفع" : "Payment"}</h2><p>{websitePaymentMethod(order, locale)}</p><WebsiteOrderStatus order={order} locale={locale} /><p className="text-2xl font-bold">{money(order.total)}</p>{order.payment?.paid_at && <p className="text-sm text-muted-foreground">{ar ? "تاريخ تأكيد الدفع: " : "Payment confirmed: "}{new Date(order.payment.paid_at).toLocaleString(ar ? "ar-EG" : "en-EG", { timeZone: "Africa/Cairo" })}</p>}<p className="text-xs text-muted-foreground">{ar ? "حالة الدفع منفصلة عن حالة التوصيل. لا يتم اعتبار طلبات الدفع عند الاستلام محصّلة تلقائيًا." : "Payment status is separate from delivery status. Cash on delivery is not automatically treated as collected."}</p></section>
    </div>
    <section className="mt-5 rounded-2xl border bg-white overflow-hidden"><h2 className="p-5 font-semibold">{ar ? "المنتجات" : "Items"}</h2><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-neutral-50"><tr>{[ar ? "المنتج" : "Product", ar ? "الكمية" : "Quantity", ar ? "السعر" : "Unit price", ar ? "الإجمالي" : "Total"].map(label => <th key={label} className="px-5 py-3 text-start">{label}</th>)}</tr></thead><tbody>{items.map((item, index) => <tr key={index} className="border-t"><td className="px-5 py-3">{text(item.name) || text(item.name_en)}<span className="block text-xs text-muted-foreground">{[item.size, item.color].map(text).filter(Boolean).join(" · ")}</span></td><td className="px-5 py-3">{text(item.quantity)}</td><td className="px-5 py-3">{money(Number(item.price) || 0)}</td><td className="px-5 py-3">{money((Number(item.price) || 0) * (Number(item.quantity) || 0))}</td></tr>)}</tbody></table></div><div className="p-5 border-t text-sm space-y-2"><p>{ar ? "المجموع: " : "Subtotal: "}{money(order.subtotal)}</p><p>{ar ? "الضريبة: " : "VAT: "}{money(Math.max(0, Number(order.total) - Number(order.subtotal) - Number(order.shipping)))}</p><p>{ar ? "الشحن: " : "Shipping: "}{money(order.shipping)}</p><p className="font-bold">{ar ? "الإجمالي: " : "Total: "}{money(order.total)}</p></div></section>
    {order.notes && <section className="mt-5 rounded-2xl border bg-white p-5"><h2 className="font-semibold mb-2">{ar ? "ملاحظات" : "Notes"}</h2><p className="text-sm whitespace-pre-wrap">{order.notes}</p></section>}
  </div>;
}
