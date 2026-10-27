import Link from "next/link";
import { getLocale } from "next-intl/server";
import { loadDashboardWebsiteOrders } from "@/lib/orders/server";
import { isTestOrder } from "@/lib/orders/summary";
import { WebsiteOrdersSummary } from "@/components/dashboard/WebsiteOrdersSummary";
import { fulfillmentLabel, websitePaymentMethod, WebsiteOrderStatus } from "@/components/dashboard/WebsiteOrderStatus";

export const dynamic = "force-dynamic";

export default async function WebsiteOrdersPage() {
  const locale = await getLocale();
  const ar = locale === "ar";
  const { authorized, orders } = await loadDashboardWebsiteOrders();
  if (!authorized) return <p>{ar ? "ليس لديك صلاحية عرض طلبات الموقع." : "You do not have access to website orders."}</p>;
  return <div>
    <h1 className="text-2xl font-bold text-neutral-900">{ar ? "طلبات الموقع" : "Website orders"}</h1>
    <WebsiteOrdersSummary orders={orders} locale={locale} />
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b bg-neutral-50">{[ar ? "الطلب" : "Order", ar ? "العميل" : "Customer", ar ? "التاريخ" : "Date", ar ? "الإجمالي" : "Total", ar ? "طريقة الدفع" : "Payment method", ar ? "الدفع" : "Payment", ar ? "التوصيل" : "Fulfillment"].map((label) => <th key={label} className="text-start px-4 py-3 font-semibold text-neutral-600">{label}</th>)}</tr></thead>
        <tbody>{orders.length ? orders.map((order) => <tr key={order.id} className="border-b border-neutral-100">
          <td className="px-4 py-3"><Link className="font-mono text-xs font-semibold text-paws-orange hover:underline" href={`/${locale}/dashboard/orders/${order.id}`}>{order.order_number}</Link>{isTestOrder(order) && <span className="block text-xs text-amber-700 mt-1">{ar ? "تجريبي — لا يتم تنفيذه" : "Test — do not fulfill"}</span>}</td>
          <td className="px-4 py-3"><p className="font-medium">{order.customer_name}</p><p className="text-xs text-muted-foreground" dir="ltr">{order.customer_phone}</p></td>
          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(order.created_at).toLocaleString(ar ? "ar-EG" : "en-EG", { timeZone: "Africa/Cairo", dateStyle: "medium", timeStyle: "short" })}</td>
          <td className="px-4 py-3 font-semibold whitespace-nowrap">{Number(order.total).toLocaleString(ar ? "ar-EG" : "en-EG")} {ar ? "ج.م" : "EGP"}</td>
          <td className="px-4 py-3">{websitePaymentMethod(order, locale)}</td>
          <td className="px-4 py-3"><WebsiteOrderStatus order={order} locale={locale} /></td>
          <td className="px-4 py-3">{fulfillmentLabel(order.status, locale)}</td>
        </tr>) : <tr><td className="px-4 py-12 text-center text-muted-foreground" colSpan={7}>{ar ? "لا توجد طلبات موقع حتى الآن." : "No website orders yet."}</td></tr>}</tbody>
      </table>
    </div>
  </div>;
}
