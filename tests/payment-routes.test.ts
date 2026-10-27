import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { POST as checkout } from "../src/app/api/orders/route";
import { POST as webhook } from "../src/app/api/payments/fawaterak/webhook_json/route";
import { GET as availability } from "../src/app/api/payments/fawaterak/route";

const originalFetch = global.fetch;
const originalEnv = { ...process.env };
const productId = "11111111-1111-4111-8111-111111111111";
const variantId = "22222222-2222-4222-8222-222222222222";
const order = {
  id: "33333333-3333-4333-8333-333333333333",
  access_token: "44444444-4444-4444-8444-444444444444",
  order_number: "TEST-ORDER",
};
const payload = {
  request_id: "55555555-5555-4555-8555-555555555555",
  locale: "ar",
  payment_method: "fawaterak",
  total: 114,
  customer_name: "Test Customer",
  customer_phone: "01000000000",
  customer_email: null,
  shipping_address: { street: "Test street", city: "Cairo" },
  items: [{ productId, variantId, quantity: 1 }],
};
const key = "test-api-key";
let calls: { url: URL; init?: RequestInit }[];
let existing: typeof order | null;
let paymentStatus: string;
let invoiceTotal: number;
let gatewayFailure: boolean;

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://database.example.invalid";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  process.env.NEXT_PUBLIC_SITE_URL = "https://pawsegypt.com";
  process.env.FAWATERAK_ENABLED = "true";
  process.env.FAWATERAK_ENVIRONMENT = "staging";
  process.env.FAWATERAK_API_KEY = key;
  delete process.env.STORE_ORDER_EMAIL;
  existing = null;
  paymentStatus = "pending";
  invoiceTotal = 114;
  gatewayFailure = false;
  calls = [];
  global.fetch = async (input, init) => {
    const url = new URL(String(input));
    calls.push({ url, init });
    if (url.hostname === "staging.fawaterk.com") {
      if (gatewayFailure) return Response.json({ error: key }, { status: 503 });
      if (url.pathname.endsWith("createInvoiceLink"))
        return Response.json({
          status: "success",
          data: {
            invoiceId: 123,
            invoiceKey: "invoice-key",
            url: "https://staging.fawaterk.com/link/test",
          },
        });
      if (url.pathname.endsWith("getInvoiceData/123"))
        return Response.json({
          status: "success",
          data: {
            invoice_id: 123,
            invoice_key: "invoice-key",
            paid: 1,
            total: invoiceTotal,
            currency: "EGP",
          },
        });
    }
    if (url.hostname === "database.example.invalid") {
      if (url.pathname.endsWith("/website_orders"))
        return Response.json(existing ? [existing] : []);
      if (url.pathname.endsWith("/products"))
        return Response.json([
          { id: productId, name_en: "Test food", is_active: true },
        ]);
      if (url.pathname.endsWith("/product_variants"))
        return Response.json([
          {
            id: variantId,
            product_id: productId,
            price: 100,
            is_active: true,
            size: null,
            color: null,
          },
        ]);
      if (url.pathname.endsWith("/rpc/create_website_checkout"))
        return Response.json(order);
      if (url.pathname.endsWith("/website_order_payments")) {
        if (init?.method === "PATCH")
          return new Response(null, { status: 204 });
        return Response.json([
          {
            order_id: order.id,
            invoice_id: "123",
            invoice_key: "invoice-key",
            amount: 114,
            currency: "EGP",
            environment: "staging",
            status: paymentStatus,
            checkout_url: "https://staging.fawaterk.com/link/test",
          },
        ]);
      }
    }
    throw new Error(
      `Unexpected test network request: ${url.origin}${url.pathname}`,
    );
  };
});
afterEach(() => {
  global.fetch = originalFetch;
  process.env = { ...originalEnv };
});

function request(body: unknown) {
  return new Request("https://pawsegypt.com/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-host": "evil.example.invalid",
    },
    body: JSON.stringify(body),
  });
}
function callback() {
  return {
    invoice_id: 123,
    invoice_key: "invoice-key",
    payment_method: "Card",
    invoice_status: "paid",
    hashKey: createHmac("sha256", key)
      .update("InvoiceId=123&InvoiceKey=invoice-key&PaymentMethod=Card")
      .digest("hex"),
  };
}

test("checkout creates an Arabic hosted payment with catalog amounts and trusted URLs", async () => {
  const response = await checkout(
    request({ ...payload, items: [{ ...payload.items[0], price: 1 }] }),
  );
  assert.equal(response.status, 200);
  assert.equal(
    (await response.json()).payment_url,
    "https://staging.fawaterk.com/link/test",
  );
  const gateway = calls.find((call) =>
    call.url.pathname.endsWith("createInvoiceLink"),
  )!;
  const sent = JSON.parse(String(gateway.init?.body));
  assert.equal(sent.cartTotal, "114.00");
  assert.equal(sent.cartItems[0].price, "100.00");
  assert.match(
    sent.redirectionUrls.successUrl,
    /^https:\/\/pawsegypt.com\/ar\/orders\//,
  );
  assert.equal(
    sent.redirectionUrls.webhookUrl,
    "https://pawsegypt.com/api/payments/fawaterak/webhook_json",
  );
  assert.equal(
    calls.filter(
      (call) =>
        call.init?.method === "POST" &&
        call.url.hostname === "staging.fawaterk.com",
    ).length,
    1,
  );
});

test("cash on delivery creates no gateway invoice", async () => {
  const response = await checkout(
    request({ ...payload, payment_method: "cod" }),
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).payment_url, null);
  assert.equal(
    calls.some((call) => call.url.hostname === "staging.fawaterk.com"),
    false,
  );
});

test("checkout rejects a changed displayed total before creating an order", async () => {
  assert.equal((await checkout(request({ ...payload, total: 1 }))).status, 409);
  assert.equal(
    calls.some((call) => call.url.pathname.includes("/rpc/")),
    false,
  );
});

test("a repeated checkout returns its existing invoice without creating another", async () => {
  existing = order;
  assert.equal((await checkout(request(payload))).status, 200);
  assert.equal(
    calls.some((call) => call.init?.method === "POST"),
    false,
  );
});

test("initializing retries wait instead of creating a second invoice", async () => {
  existing = order;
  paymentStatus = "initializing";
  assert.equal((await checkout(request(payload))).status, 409);
  assert.equal(
    calls.some((call) => call.init?.method === "POST"),
    false,
  );
});

test("gateway failures keep an order reference and never expose the provider response", async () => {
  gatewayFailure = true;
  const response = await checkout(request(payload));
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.access_token, order.access_token);
  assert.equal(data.payment_url, null);
  assert.equal(JSON.stringify(data).includes(key), false);
  assert.equal(
    calls
      .filter((call) => call.init?.method === "PATCH")
      .some((call) => JSON.parse(String(call.init?.body)).status === "failed"),
    true,
  );
});

test("disabled online payments and malformed orders never reach the database", async () => {
  process.env.FAWATERAK_ENABLED = "false";
  assert.equal((await checkout(request(payload))).status, 503);
  assert.equal((await checkout(request(null))).status, 400);
  assert.equal(calls.length, 0);
  assert.equal((await (await availability()).json()).available, false);
});

test("webhook verifies the provider invoice before marking paid", async () => {
  assert.equal((await webhook(request(callback()))).status, 200);
  assert.equal(calls.filter((call) => call.init?.method === "PATCH").length, 1);
});

test("duplicate paid callbacks are idempotent", async () => {
  paymentStatus = "paid";
  assert.equal((await webhook(request(callback()))).status, 200);
  assert.equal(
    calls.some(
      (call) =>
        call.init?.method === "PATCH" ||
        call.url.hostname === "staging.fawaterk.com",
    ),
    false,
  );
});

test("disabling new payments still allows existing invoices to be verified", async () => {
  process.env.FAWATERAK_ENABLED = "false";
  assert.equal((await webhook(request(callback()))).status, 200);
});

test("underpaid invoices and forged callbacks cannot change payment state", async () => {
  invoiceTotal = 1;
  assert.equal((await webhook(request(callback()))).status, 409);
  assert.equal(
    (await webhook(request({ ...callback(), hashKey: "forged" }))).status,
    401,
  );
  assert.equal(
    calls.some((call) => call.init?.method === "PATCH"),
    false,
  );
});

test("form callbacks use the same signature and invoice verification", async () => {
  const response = await webhook(
    new Request("https://pawsegypt.com/api/payments/fawaterak/webhook_json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(
        Object.fromEntries(
          Object.entries(callback()).map(([key, value]) => [
            key,
            String(value),
          ]),
        ),
      ),
    }),
  );
  assert.equal(response.status, 200);
});
