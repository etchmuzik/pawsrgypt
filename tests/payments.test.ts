import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { priceCart, checkoutSchema } from "../src/lib/payments/checkout";
import {
  FawaterakClient,
  verifyPaidWebhook,
  matchesInvoice,
  trustedPaymentUrl,
} from "../src/lib/payments/fawaterak";

const productId = "11111111-1111-4111-8111-111111111111";
const variantId = "22222222-2222-4222-8222-222222222222";
const product = { id: productId, name_en: "Cat food", is_active: true };
const variant = {
  id: variantId,
  product_id: productId,
  price: 125.5,
  is_active: true,
  size: "1 kg",
  color: null,
};

test("prices come from the catalog, including the existing 14% checkout calculation", () => {
  const result = priceCart(
    [{ productId, variantId, quantity: 2, price: 1 }],
    [product],
    [variant],
  );
  assert.equal(result.subtotal, 251);
  assert.equal(result.tax, 35);
  assert.equal(result.total, 286);
  assert.equal(result.items[0].price, 125.5);
});

test("rejects inactive products, cross-product variants, and ambiguous selections", () => {
  assert.throws(() =>
    priceCart(
      [{ productId, variantId, quantity: 1 }],
      [{ ...product, is_active: false }],
      [variant],
    ),
  );
  assert.throws(() =>
    priceCart(
      [{ productId, variantId, quantity: 1 }],
      [product],
      [{ ...variant, product_id: variantId }],
    ),
  );
  assert.throws(() =>
    priceCart(
      [{ productId, quantity: 1 }],
      [product],
      [variant, { ...variant, id: productId }],
    ),
  );
});

test("validates JSON shape and quantities before reaching the database", () => {
  assert.equal(checkoutSchema.safeParse(null).success, false);
  assert.equal(
    checkoutSchema.safeParse({ items: [{ productId, quantity: -1 }] }).success,
    false,
  );
});

const callback = {
  invoice_id: 123,
  invoice_key: "invoice-key",
  payment_method: "Card",
  invoice_status: "paid",
  hashKey: "",
};
const secret = "test-vendor-secret";
const hash = createHmac("sha256", secret)
  .update("InvoiceId=123&InvoiceKey=invoice-key&PaymentMethod=Card")
  .digest("hex");

test("accepts a signed paid callback and rejects tampered or malformed callbacks", () => {
  assert.equal(verifyPaidWebhook({ ...callback, hashKey: hash }, secret), true);
  assert.equal(
    verifyPaidWebhook(
      { ...callback, hashKey: hash, invoice_key: "changed" },
      secret,
    ),
    false,
  );
  assert.equal(
    verifyPaidWebhook(
      { ...callback, hashKey: hash, invoice_status: "failed" },
      secret,
    ),
    false,
  );
  assert.equal(verifyPaidWebhook({ ...callback, hashKey: "x" }, secret), false);
  assert.equal(verifyPaidWebhook(null, secret), false);
});

test("payment verification requires matching invoice, amount, currency and paid state", () => {
  const expected = {
    invoice_id: "123",
    invoice_key: "invoice-key",
    amount: 286,
    currency: "EGP",
  };
  const invoice = {
    invoice_id: 123,
    invoice_key: "invoice-key",
    total: "286.00",
    currency: "EGP",
    paid: 1,
  };
  assert.equal(matchesInvoice(invoice, expected), true);
  for (const mismatch of [
    { paid: 0 },
    { total: "1.00" },
    { currency: "USD" },
    { invoice_id: 456 },
    { invoice_key: "wrong" },
  ]) {
    assert.equal(matchesInvoice({ ...invoice, ...mismatch }, expected), false);
  }
});

test("redirects only to HTTPS on the configured Fawaterak host", () => {
  assert.equal(
    trustedPaymentUrl("https://staging.fawaterk.com/link/test", "staging"),
    true,
  );
  for (const url of [
    "javascript:alert(1)",
    "https://staging.fawaterk.com.evil.test/link/1",
    "https://app.fawaterk.com/link/1",
    "http://staging.fawaterk.com/link/1",
  ]) {
    assert.equal(trustedPaymentUrl(url, "staging"), false);
  }
});

test("invoice creation keeps the key on the server and uses a hosted checkout", async () => {
  const client = new FawaterakClient(
    { apiKey: secret, environment: "staging" },
    async (url, init) => {
      assert.equal(
        url,
        "https://staging.fawaterk.com/api/v2/createInvoiceLink",
      );
      assert.equal(
        new Headers(init?.headers).get("Authorization"),
        `Bearer ${secret}`,
      );
      return Response.json({
        status: "success",
        data: {
          url: "https://staging.fawaterk.com/link/test",
          invoiceId: 123,
          invoiceKey: "invoice-key",
        },
      });
    },
  );
  assert.equal(
    (await client.createInvoice({ cartTotal: "286.00" })).invoiceId,
    "123",
  );
});

test("gateway errors and untrusted payment links never reach the browser", async () => {
  for (const response of [
    Response.json({ message: secret }, { status: 401 }),
    Response.json({
      status: "success",
      data: { url: "https://evil.test", invoiceId: 1, invoiceKey: "key" },
    }),
  ]) {
    const client = new FawaterakClient(
      { apiKey: secret, environment: "staging" },
      async () => response,
    );
    await assert.rejects(
      client.createInvoice({}),
      (err: Error) => !err.message.includes(secret),
    );
  }
});
