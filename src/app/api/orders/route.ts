import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import {
  customerOrderConfirmation,
  internalOrderAlert,
} from "@/lib/email/order-templates";

export const runtime = "nodejs";

interface OrderItemPayload {
  productId: string;
  variantId?: string | null;
  name: string;
  price: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

interface CreateOrderBody {
  customer_name: string;
  customer_email?: string | null;
  customer_phone: string;
  shipping_address: { street: string; city: string; area?: string | null };
  items: OrderItemPayload[];
  subtotal: number;
  shipping: number;
  total: number;
}

function originFrom(req: Request): string {
  const url = new URL(req.url);
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost ?? url.host;
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  let body: CreateOrderBody;
  try {
    body = (await req.json()) as CreateOrderBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Basic server-side validation (defense in depth; DB CHECK constraints also enforce).
  if (
    !body.customer_name?.trim() ||
    !body.customer_phone?.trim() ||
    !body.shipping_address?.street?.trim() ||
    !body.shipping_address?.city?.trim() ||
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    body.total < 0 ||
    body.subtotal < 0
  ) {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const orderNumber = `WEB-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0")}`;

  const insertPayload = {
    order_number: orderNumber,
    customer_name: body.customer_name.trim(),
    customer_email: body.customer_email?.trim() || null,
    customer_phone: body.customer_phone.trim(),
    shipping_address: JSON.stringify(body.shipping_address),
    items: JSON.stringify(body.items),
    subtotal: body.subtotal,
    shipping: body.shipping,
    total: body.total,
    status: "pending",
  };

  const { data, error } = await supabase
    .from("website_orders" as never)
    .insert(insertPayload as never)
    .select("access_token, order_number")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create order" },
      { status: 500 }
    );
  }

  const created = data as { access_token: string; order_number: string };

  // Fire emails — don't block on failure, just log
  const siteOrigin = originFrom(req);
  const context = {
    orderNumber: created.order_number,
    accessToken: created.access_token,
    customerName: body.customer_name,
    customerEmail: body.customer_email ?? null,
    customerPhone: body.customer_phone,
    items: body.items.map((item) => ({
      ...item,
      variantId: item.variantId ?? null,
    })),
    subtotal: body.subtotal,
    shipping: body.shipping,
    total: body.total,
    address: {
      street: body.shipping_address.street,
      city: body.shipping_address.city,
      area: body.shipping_address.area ?? null,
    },
    siteOrigin,
  };

  // Customer confirmation (only if we have an email)
  const customerMsg = customerOrderConfirmation(context);
  if (customerMsg) {
    sendEmail(customerMsg).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[order] customer email failed:", err);
    });
  }

  // Internal alert
  const internalTo = process.env.STORE_ORDER_EMAIL;
  if (internalTo) {
    const internalMsg = internalOrderAlert(context, internalTo);
    sendEmail(internalMsg).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[order] internal email failed:", err);
    });
  }

  return NextResponse.json({
    order_number: created.order_number,
    access_token: created.access_token,
  });
}
