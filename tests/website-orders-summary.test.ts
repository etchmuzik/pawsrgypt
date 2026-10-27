import { test } from "node:test";
import assert from "node:assert/strict";
import { confirmedOnlineReceipt, summarizeWebsiteOrders, type DashboardWebsiteOrder } from "../src/lib/orders/summary";

function order(overrides: Partial<DashboardWebsiteOrder> = {}): DashboardWebsiteOrder {
  return {
    id: "order-1", order_number: "WEB-1", customer_name: "Customer", customer_email: null,
    customer_phone: null, shipping_address: {}, items: [], subtotal: 100, shipping: 0,
    total: 114, status: "pending", notes: null, created_at: "2026-10-27T20:00:00Z",
    payment: { method: "fawaterak", status: "paid", amount: 114, currency: "EGP", environment: "production", paid_at: "2026-10-28T10:00:00Z" },
    ...overrides,
  };
}

test("only matching production online payments count as confirmed online receipts", () => {
  const paid = order();
  assert.equal(confirmedOnlineReceipt(paid), true);
  for (const payment of [
    { ...paid.payment!, status: "pending" as const },
    { ...paid.payment!, method: "cod" as const },
    { ...paid.payment!, amount: 1 },
    { ...paid.payment!, currency: "USD" },
    { ...paid.payment!, environment: "staging" as const },
  ]) assert.equal(confirmedOnlineReceipt(order({ payment })), false);
  assert.equal(confirmedOnlineReceipt(order({ payment: null })), false);
});

test("test orders do not inflate order or receipt totals", () => {
  const stats = summarizeWebsiteOrders([
    order(), order({ id: "test", order_number: "TEST-PAY-1" }),
    order({ id: "staging", payment: { ...order().payment!, environment: "staging" } }),
  ]);
  assert.equal(stats.orderCount, 1);
  assert.equal(stats.confirmedOnlineTotal, 114);
});

test("cash on delivery and pending online orders remain visible without collected revenue", () => {
  const stats = summarizeWebsiteOrders([
    order({ payment: { ...order().payment!, method: "cod", status: "unpaid", environment: null, paid_at: null } }),
    order({ payment: { ...order().payment!, status: "pending", paid_at: null } }),
    order({ payment: null }),
  ]);
  assert.equal(stats.orderCount, 3);
  assert.equal(stats.codCount, 1);
  assert.equal(stats.pendingCount, 1);
  assert.equal(stats.confirmedOnlineTotal, 0);
});

test("range receipts follow Cairo payment date rather than order creation date", () => {
  const stats = summarizeWebsiteOrders([
    order({ created_at: "2026-10-20T10:00:00Z", payment: { ...order().payment!, paid_at: "2026-10-27T22:30:00Z" } }),
    order({ created_at: "2026-10-28T10:00:00Z", payment: { ...order().payment!, status: "pending", paid_at: null } }),
  ], { from: "2026-10-28", to: "2026-10-28" });
  assert.equal(stats.orderCount, 1);
  assert.equal(stats.confirmedOnlineCount, 1);
  assert.equal(stats.confirmedOnlineTotal, 114);
});

test("cancelled orders do not inflate outstanding orders or active order value", () => {
  const stats = summarizeWebsiteOrders([
    order({ status: "cancelled", payment: { ...order().payment!, status: "pending", paid_at: null } }),
    order({ status: "cancelled", payment: { ...order().payment!, method: "cod", status: "unpaid", environment: null, paid_at: null } }),
  ]);
  assert.equal(stats.orderCount, 2);
  assert.equal(stats.orderValue, 0);
  assert.equal(stats.pendingCount, 0);
  assert.equal(stats.codCount, 0);
});
