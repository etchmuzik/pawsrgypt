import { createAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "next-intl/server";
import { trustedPaymentUrl } from "@/lib/payments/fawaterak";
import { PaymentRefresh } from "@/components/website/PaymentRefresh";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  XCircle,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface ShippingAddress {
  street: string;
  city: string;
  area: string | null;
}

interface OrderItem {
  productId: string;
  variantId: string | null;
  name: string;
  price: number;
  quantity: number;
  size: string | null;
  color: string | null;
}

interface Order {
  id: string;
  order_number: string;
  checkout_request_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  shipping_address: string | ShippingAddress;
  items: string | OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  notes: string | null;
  created_at: string;
}

export const metadata: Metadata = {
  title: "Order Confirmation",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const STATUS_META: Record<
  Order["status"],
  { label: string; labelAr: string; icon: typeof Clock; color: string }
> = {
  pending: {
    label: "Order Received",
    labelAr: "تم استلام الطلب",
    icon: Clock,
    color: "text-amber-600 bg-amber-50",
  },
  confirmed: {
    label: "Confirmed",
    labelAr: "تم التأكيد",
    icon: CheckCircle2,
    color: "text-blue-600 bg-blue-50",
  },
  shipped: {
    label: "Shipped",
    labelAr: "تم الشحن",
    icon: Truck,
    color: "text-indigo-600 bg-indigo-50",
  },
  delivered: {
    label: "Delivered",
    labelAr: "تم التوصيل",
    icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-50",
  },
  cancelled: {
    label: "Cancelled",
    labelAr: "ملغي",
    icon: XCircle,
    color: "text-red-600 bg-red-50",
  },
};

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { locale, token } = await params;

  // Guard: token must look like a UUID (defensive; RLS also protects)
  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    notFound();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("website_orders" as never)
    .select("*")
    .eq("access_token", token)
    .single();

  const order = data as Order | null;

  if (error || !order) {
    notFound();
  }
  const t = await getTranslations({ locale, namespace: "payment" });
  const { payment: returnState } = await searchParams;
  const { data: paymentData } = await supabase.from("website_order_payments" as never)
    .select("method, status, checkout_url, environment").eq("order_id", order.id).maybeSingle();
  const payment = paymentData as { method: string; status: string; checkout_url: string | null; environment: "staging" | "production" } | null;
  const online = payment?.method === "fawaterak";
  const paid = payment?.status === "paid";
  const checkoutUrl = online && payment.status === "pending" && trustedPaymentUrl(payment.checkout_url, payment.environment) ? payment.checkout_url : null;

  const isAr = locale === "ar";
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  const address: ShippingAddress = typeof order.shipping_address === "string" ? JSON.parse(order.shipping_address) : order.shipping_address;
  const items: OrderItem[] = typeof order.items === "string" ? JSON.parse(order.items) : order.items;

  const statusMeta = STATUS_META[order.status];
  const StatusIcon = statusMeta.icon;

  return (
    <div className="min-h-screen bg-white">
      {/* Success banner */}
      <div className="bg-gradient-to-b from-emerald-50 to-white border-b border-neutral-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 mb-3">
            {isAr ? "شكراً لك!" : "Thank you!"}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 max-w-xl mx-auto">
            {isAr
              ? "تم استلام طلبك بنجاح. سنتواصل معك قريباً لتأكيد التوصيل."
              : "Your order has been received. We'll contact you shortly to confirm delivery."}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white border border-neutral-200 px-4 py-2 text-sm">
            <span className="text-neutral-500">
              {isAr ? "رقم الطلب:" : "Order number:"}
            </span>
            <span className="font-bold text-neutral-900 tabular-nums">
              {order.order_number}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {online && (
          <div className={`rounded-2xl border p-4 sm:p-6 ${paid ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            <h2 className="font-semibold">{paid ? t("paid") : payment.status === "failed" ? t("failed") : t("pending")}</h2>
            <p className="text-sm mt-2">{paid ? t("paidDescription") : payment.status === "failed" ? t("failedDescription") : returnState === "failed" ? t("declinedDescription") : t("pendingDescription")}</p>
            {checkoutUrl && <a href={checkoutUrl} className="inline-block mt-4 font-semibold text-paws-orange underline">{t("resume")}</a>}
            {!paid && <a href="tel:+201005285753" className="block mt-3 text-sm underline">{t("contact")}</a>}
            <PaymentRefresh pending={!paid && payment.status === "pending"} paid={paid} items={items} requestId={order.checkout_request_id} />
          </div>
        )}
        {/* Status card */}
        <div className="rounded-2xl border border-neutral-100 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${statusMeta.color}`}
            >
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-400">
                {isAr ? "الحالة" : "Status"}
              </p>
              <p className="text-base sm:text-lg font-semibold text-neutral-900">
                {isAr ? statusMeta.labelAr : statusMeta.label}
              </p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="rounded-2xl border border-neutral-100 p-4 sm:p-6">
          <h2 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" />
            {isAr ? "المنتجات" : "Items"}{" "}
            <span className="text-neutral-400 font-normal">({items.length})</span>
          </h2>
          <div className="divide-y divide-neutral-100">
            {items.map((item, i) => (
              <div
                key={`${item.productId}-${i}`}
                className="py-3 flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 line-clamp-2">
                    {item.name}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {isAr ? "الكمية:" : "Qty:"} {item.quantity}
                    {item.size && ` · ${item.size}`}
                    {item.color && ` · ${item.color}`}
                  </p>
                </div>
                <p className="text-sm font-semibold text-neutral-900 tabular-nums shrink-0">
                  {(item.price * item.quantity).toLocaleString()}{" "}
                  <span className="text-xs text-neutral-400">
                    {isAr ? "ج.م" : "EGP"}
                  </span>
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2">
            <div className="flex justify-between text-sm text-neutral-600">
              <span>{isAr ? "المجموع" : "Subtotal"}</span>
              <span className="tabular-nums">
                {order.subtotal.toLocaleString()}{" "}
                {isAr ? "ج.م" : "EGP"}
              </span>
            </div>
            <div className="flex justify-between text-sm text-neutral-600">
              <span>{isAr ? "ضريبة القيمة المضافة" : "VAT (14%)"}</span>
              <span className="tabular-nums">{Math.max(0, order.total - order.subtotal - order.shipping).toLocaleString()} {isAr ? "ج.م" : "EGP"}</span>
            </div>
            <div className="flex justify-between text-sm text-neutral-600">
              <span>{isAr ? "الشحن" : "Shipping"}</span>
              <span className="tabular-nums">
                {order.shipping > 0
                  ? `${order.shipping.toLocaleString()} ${isAr ? "ج.م" : "EGP"}`
                  : isAr
                  ? "مجاني"
                  : "Free"}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-neutral-100">
              <span className="font-bold text-neutral-900">
                {isAr ? "الإجمالي" : "Total"}
              </span>
              <span className="font-extrabold text-paws-orange text-lg tabular-nums">
                {order.total.toLocaleString()}{" "}
                <span className="text-xs font-normal text-neutral-400">
                  {isAr ? "ج.م" : "EGP"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Contact + shipping */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="rounded-2xl border border-neutral-100 p-4 sm:p-6">
            <h3 className="font-semibold text-neutral-900 mb-3 text-sm">
              {isAr ? "معلومات التواصل" : "Contact"}
            </h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex items-center gap-2">
                <span className="w-5 shrink-0">
                  <Package className="w-4 h-4 text-neutral-400" />
                </span>
                {order.customer_name}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 shrink-0">
                  <Phone className="w-4 h-4 text-neutral-400" />
                </span>
                <a
                  href={`tel:${order.customer_phone}`}
                  className="hover:text-paws-orange"
                >
                  {order.customer_phone}
                </a>
              </li>
              {order.customer_email && (
                <li className="flex items-center gap-2">
                  <span className="w-5 shrink-0">
                    <Mail className="w-4 h-4 text-neutral-400" />
                  </span>
                  <a
                    href={`mailto:${order.customer_email}`}
                    className="hover:text-paws-orange break-all"
                  >
                    {order.customer_email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-neutral-100 p-4 sm:p-6">
            <h3 className="font-semibold text-neutral-900 mb-3 text-sm">
              {isAr ? "عنوان التوصيل" : "Shipping Address"}
            </h3>
            <div className="flex gap-2 text-sm text-neutral-600">
              <span className="w-5 shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-neutral-400" />
              </span>
              <address className="not-italic">
                {address.street}
                <br />
                {address.area && (
                  <>
                    {address.area}
                    <br />
                  </>
                )}
                {address.city}
              </address>
            </div>
          </div>
        </div>

        {/* Helper text */}
        <p className="text-center text-xs sm:text-sm text-neutral-400 pt-4">
          {isAr
            ? "احفظ هذا الرابط لمتابعة حالة طلبك في أي وقت."
            : "Save this link to check your order status anytime."}
        </p>

        {/* Back to shop */}
        <div className="flex justify-center pt-2">
          <Link
            href={`/${locale}/shop`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-paws-orange hover:underline"
          >
            <BackArrow className="w-4 h-4" />
            {isAr ? "متابعة التسوق" : "Continue shopping"}
          </Link>
        </div>
      </div>
    </div>
  );
}
