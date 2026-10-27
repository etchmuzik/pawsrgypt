export type WebsitePayment = {
  method: "cod" | "fawaterak";
  status: "unpaid" | "initializing" | "pending" | "failed" | "paid";
  amount: number;
  currency: string;
  environment: "staging" | "production" | null;
  paid_at: string | null;
};

export type DashboardWebsiteOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: unknown;
  items: unknown;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  notes: string | null;
  created_at: string;
  payment: WebsitePayment | null;
};

export function isTestOrder(order: DashboardWebsiteOrder) {
  return order.order_number.startsWith("TEST-") || order.payment?.environment === "staging";
}

export function confirmedOnlineReceipt(order: DashboardWebsiteOrder) {
  const payment = order.payment;
  return !isTestOrder(order) && payment?.method === "fawaterak" &&
    payment.status === "paid" && payment.environment === "production" &&
    payment.currency === "EGP" &&
    Math.round(Number(payment.amount) * 100) === Math.round(Number(order.total) * 100);
}

function inRange(value: string | null, range?: { from: string; to: string }) {
  if (!range) return true;
  if (!value) return false;
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
  return day >= range.from && day <= range.to;
}

export function summarizeWebsiteOrders(orders: DashboardWebsiteOrder[], range?: { from: string; to: string }) {
  const real = orders.filter((order) => !isTestOrder(order));
  const placed = real.filter((order) => inRange(order.created_at, range));
  const receipts = real.filter((order) => confirmedOnlineReceipt(order) && inRange(order.payment!.paid_at, range));
  return {
    orderCount: placed.length,
    orderValue: placed.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + Number(order.total), 0),
    confirmedOnlineCount: receipts.length,
    confirmedOnlineTotal: receipts.reduce((sum, order) => sum + Number(order.payment!.amount), 0),
    pendingCount: placed.filter((order) => order.status !== "cancelled" && order.payment?.method === "fawaterak" && order.payment.status !== "paid").length,
    codCount: placed.filter((order) => order.status !== "cancelled" && order.payment?.method === "cod").length,
  };
}
