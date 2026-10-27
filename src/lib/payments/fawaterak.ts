import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

type Environment = "staging" | "production";
const HOSTS = {
  staging: "staging.fawaterk.com",
  production: "app.fawaterk.com",
};

export function gatewayConfig() {
  const environment = process.env.FAWATERAK_ENVIRONMENT ?? "staging";
  const apiKey = process.env.FAWATERAK_API_KEY;
  if (!apiKey || !["staging", "production"].includes(environment)) return null;
  return { apiKey, environment: environment as Environment };
}

export function paymentConfig() {
  return process.env.FAWATERAK_ENABLED === "true" ? gatewayConfig() : null;
}

export function trustedPaymentUrl(
  value: unknown,
  environment: Environment,
): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === HOSTS[environment] &&
      !url.username &&
      !url.password &&
      !url.port &&
      (url.pathname.startsWith("/link/") || url.pathname.startsWith("/lk/"))
    );
  } catch {
    return false;
  }
}

export class FawaterakClient {
  constructor(
    private config: { apiKey: string; environment: Environment },
    private fetcher: typeof fetch = fetch,
  ) {}

  private async request(path: string, body?: unknown) {
    const response = await this.fetcher(
      `https://${HOSTS[this.config.environment]}/api/v2/${path}`,
      {
        method: body ? "POST" : "GET",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
      },
    );
    if (!response.ok) throw new Error("Payment provider is unavailable.");
    const result = await response.json();
    if (result?.status !== "success" || !result.data)
      throw new Error("Payment provider returned an invalid response.");
    return result.data;
  }

  async createInvoice(
    body: unknown,
  ): Promise<{ url: string; invoiceId: string; invoiceKey: string }> {
    const data = await this.request("createInvoiceLink", body);
    if (
      !trustedPaymentUrl(data.url, this.config.environment) ||
      !/^\d+$/.test(String(data.invoiceId)) ||
      typeof data.invoiceKey !== "string" ||
      !data.invoiceKey
    ) {
      throw new Error("Payment provider returned an invalid checkout.");
    }
    return {
      url: data.url,
      invoiceId: String(data.invoiceId),
      invoiceKey: data.invoiceKey,
    };
  }

  async getInvoice(id: string) {
    if (!/^\d+$/.test(id)) throw new Error("Invalid invoice ID.");
    return this.request(`getInvoiceData/${id}`);
  }
}

export type PaidWebhook = {
  invoice_id: number | string;
  invoice_key: string;
  payment_method: string;
  invoice_status: "paid";
  hashKey: string;
};

export function verifyPaidWebhook(
  value: unknown,
  secret: string,
): value is PaidWebhook {
  if (!value || typeof value !== "object") return false;
  const body = value as Partial<PaidWebhook>;
  if (
    body.invoice_status !== "paid" ||
    !/^\d+$/.test(String(body.invoice_id)) ||
    typeof body.invoice_key !== "string" ||
    typeof body.payment_method !== "string" ||
    typeof body.hashKey !== "string" ||
    !/^[a-f0-9]{64}$/i.test(body.hashKey)
  )
    return false;
  const expected = createHmac("sha256", secret)
    .update(
      `InvoiceId=${body.invoice_id}&InvoiceKey=${body.invoice_key}&PaymentMethod=${body.payment_method}`,
    )
    .digest();
  return timingSafeEqual(expected, Buffer.from(body.hashKey, "hex"));
}

export function matchesInvoice(
  value: Record<string, unknown>,
  expected: {
    invoice_id: string;
    invoice_key: string;
    amount: number;
    currency: string;
  },
) {
  const amount = Number(value.total);
  return (
    String(value.invoice_id) === expected.invoice_id &&
    value.invoice_key === expected.invoice_key &&
    (value.paid === 1 || value.paid === "1" || value.paid === true) &&
    value.currency === expected.currency &&
    Number.isFinite(amount) &&
    Math.round(amount * 100) === Math.round(expected.amount * 100)
  );
}

export function siteOrigin() {
  const url = new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://pawsegypt.com",
  );
  if (
    url.protocol !== "https:" &&
    !(
      process.env.NODE_ENV !== "production" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("Invalid site URL.");
  return url.origin;
}
