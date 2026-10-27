import type { DashboardWebsiteOrder } from "@/lib/orders/summary";

export function WebsiteOrderStatus({ order, locale }: { order: DashboardWebsiteOrder; locale: string }) {
  const ar = locale === "ar";
  const payment = order.payment;
  const paid = payment?.status === "paid";
  const label = !payment ? (ar ? "الدفع غير مسجل" : "Payment not recorded")
    : paid ? (ar ? "تم الدفع" : "Paid")
    : payment.method === "cod" ? (ar ? "في انتظار التحصيل" : "Awaiting collection")
    : payment.status === "failed" ? (ar ? "تعذّر بدء الدفع" : "Payment failed")
    : (ar ? "في انتظار الدفع" : "Awaiting payment");
  return <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${paid ? "bg-green-100 text-green-700" : payment?.status === "failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>{label}</span>;
}

export function websitePaymentMethod(order: DashboardWebsiteOrder, locale: string) {
  const ar = locale === "ar";
  return order.payment?.method === "cod" ? (ar ? "الدفع عند الاستلام" : "Cash on delivery")
    : order.payment?.method === "fawaterak" ? (ar ? "أونلاين" : "Online")
    : (ar ? "غير مسجل" : "Not recorded");
}

export function fulfillmentLabel(status: string, locale: string) {
  const names: Record<string, [string, string]> = {
    pending: ["Pending", "قيد الانتظار"], confirmed: ["Confirmed", "مؤكد"], shipped: ["Shipped", "تم الشحن"],
    delivered: ["Delivered", "تم التوصيل"], cancelled: ["Cancelled", "ملغي"],
  };
  return names[status]?.[locale === "ar" ? 1 : 0] ?? status;
}
