import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  FawaterakClient,
  gatewayConfig,
  verifyPaidWebhook,
  matchesInvoice,
} from "@/lib/payments/fawaterak";

export const runtime = "nodejs";
export async function POST(req: Request) {
  // Turning off new checkouts must not discard callbacks for existing invoices.
  const config = gatewayConfig();
  if (!config)
    return NextResponse.json(
      { error: "Payment integration unavailable" },
      { status: 503 },
    );
  let body: unknown;
  try {
    body = req.headers.get("content-type")?.includes("application/json")
      ? await req.json()
      : Object.fromEntries(new URLSearchParams(await req.text()));
  } catch {
    return NextResponse.json({ error: "Invalid callback" }, { status: 400 });
  }
  if (!verifyPaidWebhook(body, config.apiKey))
    return NextResponse.json(
      { error: "Invalid callback signature or state" },
      { status: 401 },
    );
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("website_order_payments" as never)
      .select(
        "order_id, invoice_id, invoice_key, amount, currency, status, environment",
      )
      .eq("invoice_id", String(body.invoice_id))
      .maybeSingle();
    // A callback can arrive before the invoice has been saved. Return non-2xx for retry.
    if (error || !data)
      return NextResponse.json({ error: "Payment not ready" }, { status: 503 });
    const payment = data as {
      order_id: string;
      invoice_id: string;
      invoice_key: string;
      amount: number;
      currency: string;
      status: string;
      environment: string;
    };
    if (
      payment.invoice_key !== body.invoice_key ||
      payment.environment !== config.environment
    )
      return NextResponse.json({ error: "Invoice mismatch" }, { status: 400 });
    if (payment.status === "paid") return NextResponse.json({ received: true });
    const invoice = await new FawaterakClient(config).getInvoice(
      payment.invoice_id,
    );
    if (!matchesInvoice(invoice, payment))
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 409 },
      );
    const { error: updateError } = await supabase
      .from("website_order_payments" as never)
      .update({ status: "paid", paid_at: new Date().toISOString() } as never)
      .eq("order_id", payment.order_id)
      .neq("status", "paid");
    if (updateError) throw new Error("Payment update failed");
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Payment verification unavailable" },
      { status: 503 },
    );
  }
}
