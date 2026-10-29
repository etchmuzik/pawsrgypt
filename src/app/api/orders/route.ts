import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkoutSchema,
  priceCart,
  type CatalogProduct,
  type CatalogVariant,
} from "@/lib/payments/checkout";
import {
  FawaterakClient,
  paymentConfig,
  siteOrigin,
} from "@/lib/payments/fawaterak";
import { sendEmail } from "@/lib/email";
import {
  customerOrderConfirmation,
  internalOrderAlert,
} from "@/lib/email/order-templates";

export const runtime = "nodejs";
type CreatedOrder = { id: string; access_token: string; order_number: string };

function orderResponse(order: CreatedOrder, url?: string | null) {
  return NextResponse.json(
    {
      order_number: order.order_number,
      access_token: order.access_token,
      payment_url: url ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Missing or invalid checkout fields." },
      { status: 400 },
    );
  const body = parsed.data;
  const config = paymentConfig();
  if (body.payment_method === "fawaterak" && !config)
    return NextResponse.json(
      { error: "Online payment is currently unavailable." },
      { status: 503 },
    );

  try {
    const supabase = createAdminClient();
    const orders = () => supabase.from("website_orders" as never);
    const payments = () => supabase.from("website_order_payments" as never);
    // Reuse the order on retries. Never repeat a gateway request after a timeout:
    // the provider may already have created an invoice.
    const { data: existing, error: lookupError } = await orders()
      .select("id, access_token, order_number")
      .eq("checkout_request_id", body.request_id)
      .maybeSingle();
    if (lookupError) throw new Error("Order lookup failed");
    if (existing) {
      const order = existing as CreatedOrder;
      const { data: payment, error } = await payments()
        .select("checkout_url, status")
        .eq("order_id", order.id)
        .maybeSingle();
      if (
        error ||
        !payment ||
        (payment as { status: string }).status === "initializing"
      ) {
        return NextResponse.json(
          {
            error:
              "Your order is still being prepared. Please try again shortly.",
          },
          { status: 409 },
        );
      }
      const saved = payment as { checkout_url: string | null; status: string };
      return orderResponse(
        order,
        saved.status === "pending" ? saved.checkout_url : null,
      );
    }

    const ids = [...new Set(body.items.map((item) => item.productId))];
    const [productsResult, variantsResult] = await Promise.all([
      supabase.from("products").select("id, name_en, is_active, delivery_cost").in("id", ids),
      supabase
        .from("product_variants")
        .select("id, product_id, price, is_active, size, color")
        .in("product_id", ids),
    ]);
    if (productsResult.error || variantsResult.error)
      throw new Error("Catalog lookup failed");
    let priced: ReturnType<typeof priceCart>;
    try {
      priced = priceCart(
        body.items,
        productsResult.data as CatalogProduct[],
        variantsResult.data as CatalogVariant[],
      );
    } catch {
      return NextResponse.json(
        { error: "A product is unavailable. Please refresh your cart." },
        { status: 400 },
      );
    }
    if (Math.round(body.total * 100) !== Math.round(priced.total * 100)) {
      return NextResponse.json(
        {
          error:
            "Product prices have changed. Please review your cart before paying.",
        },
        { status: 409 },
      );
    }
    const origin = siteOrigin();
    const { data, error } = await supabase
      .rpc(
        "create_website_checkout" as never,
        {
          p_request_id: body.request_id,
          p_method: body.payment_method,
          p_environment:
            body.payment_method === "fawaterak" ? config!.environment : null,
          p_order: {
            order_number: `WEB-${Date.now()}-${randomUUID().slice(0, 8)}`,
            customer_name: body.customer_name,
            customer_email: body.customer_email || null,
            customer_phone: body.customer_phone,
            shipping_address: body.shipping_address,
            items: priced.items,
            subtotal: priced.subtotal,
            shipping: priced.shipping,
            total: priced.total,
            status: "pending",
          },
        } as never,
      )
      .single();
    if (error?.code === "23505")
      return NextResponse.json(
        {
          error:
            "Your order is already being prepared. Please try again shortly.",
        },
        { status: 409 },
      );
    if (error || !data) throw new Error("Order insert failed");
    const created = data as CreatedOrder;

    let paymentUrl: string | null = null;
    if (body.payment_method === "fawaterak") {
      try {
        const name = body.customer_name.split(/\s+/);
        const orderUrl = `${origin}/${body.locale}/orders/${created.access_token}`;
        const invoice = await new FawaterakClient(config!).createInvoice({
          cartTotal: priced.total.toFixed(2),
          currency: "EGP",
          customer: {
            first_name: name[0],
            last_name: name.slice(1).join(" ") || name[0],
            email: body.customer_email || undefined,
            phone: body.customer_phone,
            address: [
              body.shipping_address.street,
              body.shipping_address.area,
              body.shipping_address.city,
            ]
              .filter(Boolean)
              .join(", "),
          },
          // VAT is already part of checkout's total: line items must sum exactly.
          cartItems: [
            ...(priced.shipping ? [{ name: "Delivery", price: priced.shipping.toFixed(2), quantity: 1 }] : []),
            ...priced.items.map((item) => ({
              name: item.name,
              price: item.price.toFixed(2),
              quantity: item.quantity,
            })),
            ...(priced.tax
              ? [
                  {
                    name: "VAT (14%)",
                    price: priced.tax.toFixed(2),
                    quantity: 1,
                  },
                ]
              : []),
          ],
          payLoad: { order_id: created.id },
          sendEmail: false,
          sendSMS: false,
          redirectionUrls: {
            successUrl: `${orderUrl}?payment=return`,
            failUrl: `${orderUrl}?payment=failed`,
            pendingUrl: `${orderUrl}?payment=pending`,
            webhookUrl: `${origin}/api/payments/fawaterak/webhook_json`,
          },
        });
        const { error: saveError } = await payments()
          .update({
            invoice_id: invoice.invoiceId,
            invoice_key: invoice.invoiceKey,
            checkout_url: invoice.url,
            status: "pending",
          } as never)
          .eq("order_id", created.id);
        if (saveError) throw new Error("Invoice save failed");
        paymentUrl = invoice.url;
      } catch {
        // Retain the order reference when initiation has an uncertain outcome.
        await payments()
          .update({ status: "failed" } as never)
          .eq("order_id", created.id)
          .eq("status", "initializing");
      }
    }

    const context = {
      orderNumber: created.order_number,
      accessToken: created.access_token,
      customerName: body.customer_name,
      customerEmail: body.customer_email || null,
      customerPhone: body.customer_phone,
      items: priced.items,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      total: priced.total,
      address: {
        ...body.shipping_address,
        area: body.shipping_address.area ?? null,
      },
      siteOrigin: origin,
    };
    const customer = customerOrderConfirmation(context);
    const internal = process.env.STORE_ORDER_EMAIL
      ? internalOrderAlert(context, process.env.STORE_ORDER_EMAIL)
      : null;
    await Promise.allSettled([
      ...(customer ? [sendEmail(customer)] : []),
      ...(internal ? [sendEmail(internal)] : []),
    ]);
    return orderResponse(created, paymentUrl);
  } catch {
    return NextResponse.json(
      { error: "Unable to prepare your order. Please try again shortly." },
      { status: 503 },
    );
  }
}
