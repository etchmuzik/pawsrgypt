import Link from "next/link";
import { summarizeWebsiteOrders, type DashboardWebsiteOrder } from "@/lib/orders/summary";

export function WebsiteOrdersSummary({ orders, locale, range }: { orders: DashboardWebsiteOrder[]; locale: string; range?: { from: string; to: string } }) {
  const ar = locale === "ar";
  const stats = summarizeWebsiteOrders(orders, range);
  const money = (value: number) => `${value.toLocaleString(ar ? "ar-EG" : "en-EG", { maximumFractionDigits: 2 })} ${ar ? "ج.م" : "EGP"}`;
  return (
    <section className="my-6 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-semibold text-neutral-900">{ar ? "طلبات الموقع" : "Website orders"}</h2>
        <Link className="text-sm font-semibold text-paws-orange hover:underline" href={`/${locale}/dashboard/orders`}>{ar ? "عرض الطلبات" : "View orders"}</Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          [ar ? "الطلبات" : "Orders placed", stats.orderCount],
          [ar ? "مدفوعات أونلاين مؤكدة" : "Confirmed online receipts", money(stats.confirmedOnlineTotal)],
          [ar ? "في انتظار الدفع أونلاين" : "Awaiting online payment", stats.pendingCount],
          [ar ? "طلبات الدفع عند الاستلام" : "Cash on delivery orders", stats.codCount],
        ].map(([label, value]) => <div key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-bold text-neutral-900 mt-1">{value}</p></div>)}
      </div>
      <p className="text-xs text-muted-foreground mt-4">{ar ? "طلبات الموقع منفصلة عن فواتير نقطة البيع. الإجمالي المحصّل يشمل المدفوعات الأونلاين المؤكدة فقط؛ الطلبات التجريبية والدفع عند الاستلام غير محسوبة فيه." : "Website orders are shown separately from POS invoices. Online receipts include verified payments only; test orders and cash on delivery are excluded."}</p>
    </section>
  );
}
