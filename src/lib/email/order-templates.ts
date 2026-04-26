import type { EmailMessage } from "./index";
import { escapeHtml } from "../html";

interface OrderItem {
  productId: string;
  variantId: string | null;
  name: string;
  price: number;
  quantity: number;
}

interface OrderEmailContext {
  orderNumber: string;
  accessToken: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  address: { street: string; city: string; area: string | null };
  siteOrigin: string; // e.g. "https://pawsegypt.com"
}

function money(n: number): string {
  return `${n.toLocaleString("en-US")} EGP`;
}

function itemsTable(items: OrderItem[]): string {
  const rows = items
    .map(
      (it) => `
    <tr style="border-top:1px solid #f0f0f0;">
      <td style="padding:12px 8px;font-size:14px;color:#171717;">
        ${escapeHtml(it.name)}
        <br/>
        <span style="font-size:12px;color:#999;">Qty: ${escapeHtml(it.quantity)}</span>
      </td>
      <td style="padding:12px 8px;font-size:14px;text-align:right;color:#171717;">
        ${money(it.price * it.quantity)}
      </td>
    </tr>`
    )
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rows}
    </table>`;
}

/**
 * Email to the customer with order confirmation + tracking URL.
 */
export function customerOrderConfirmation(ctx: OrderEmailContext): EmailMessage | null {
  if (!ctx.customerEmail) return null;

  const url = `${ctx.siteOrigin}/en/orders/${encodeURIComponent(ctx.accessToken)}`;
  const firstName = ctx.customerName.split(" ")[0] ?? "";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Order ${escapeHtml(ctx.orderNumber)}</title>
</head>
<body style="margin:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <h1 style="font-size:24px;color:#171717;margin:0 0 8px 0;">Thank you, ${escapeHtml(firstName)}!</h1>
    <p style="color:#666;font-size:15px;line-height:1.5;margin:0 0 24px 0;">
      Your order has been received. We'll contact you shortly to confirm delivery.
    </p>

    <div style="background:white;border:1px solid #eee;border-radius:16px;padding:24px;margin-bottom:16px;">
      <p style="margin:0 0 4px 0;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#999;">Order number</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#171717;">${escapeHtml(ctx.orderNumber)}</p>
    </div>

    <div style="background:white;border:1px solid #eee;border-radius:16px;padding:24px;margin-bottom:16px;">
      <h2 style="font-size:14px;color:#171717;margin:0 0 12px 0;">Items</h2>
      ${itemsTable(ctx.items)}
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid #eee;">
        <div style="display:flex;justify-content:space-between;font-size:14px;color:#666;margin-bottom:4px;">
          <span>Subtotal</span><span>${money(ctx.subtotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:14px;color:#666;margin-bottom:8px;">
          <span>Shipping</span><span>${ctx.shipping > 0 ? money(ctx.shipping) : "Free"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:16px;color:#171717;font-weight:700;padding-top:8px;border-top:1px solid #eee;">
          <span>Total</span><span style="color:#F47C2C;">${money(ctx.total)}</span>
        </div>
      </div>
    </div>

    <div style="background:white;border:1px solid #eee;border-radius:16px;padding:24px;margin-bottom:24px;">
      <h2 style="font-size:14px;color:#171717;margin:0 0 8px 0;">Shipping to</h2>
      <p style="margin:0;font-size:14px;color:#666;line-height:1.5;">
        ${escapeHtml(ctx.customerName)}<br/>
        ${escapeHtml(ctx.address.street)}<br/>
        ${ctx.address.area ? escapeHtml(ctx.address.area) + "<br/>" : ""}
        ${escapeHtml(ctx.address.city)}<br/>
        <span style="color:#999;">Phone: ${escapeHtml(ctx.customerPhone)}</span>
      </p>
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${escapeHtml(url)}" style="display:inline-block;background:#F47C2C;color:white;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:700;font-size:15px;">View order status</a>
    </div>

    <p style="color:#999;font-size:12px;text-align:center;line-height:1.5;">
      Questions? Reply to this email or call us anytime.<br/>
      © ${new Date().getFullYear()} PAWS Egypt
    </p>
  </div>
</body>
</html>`;

  return {
    to: ctx.customerEmail,
    subject: `Order ${ctx.orderNumber} confirmed`,
    html,
  };
}

/**
 * Internal notification to the store when a new order arrives.
 */
export function internalOrderAlert(
  ctx: OrderEmailContext,
  internalTo: string
): EmailMessage {
  const url = `${ctx.siteOrigin}/en/orders/${encodeURIComponent(ctx.accessToken)}`;

  const itemsText = ctx.items
    .map(
      (it) =>
        `• ${escapeHtml(it.name)} × ${escapeHtml(it.quantity)} — ${money(it.price * it.quantity)}`
    )
    .join("<br/>");

  // tel:/mailto: hrefs need URL-encoded user input; the visible text is HTML-escaped.
  const phoneHref = `tel:${encodeURIComponent(ctx.customerPhone)}`;
  const emailHref = ctx.customerEmail
    ? `mailto:${encodeURIComponent(ctx.customerEmail)}`
    : "";

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:24px;max-width:560px;margin:0 auto;">
  <h2 style="color:#171717;">🛒 New order: ${escapeHtml(ctx.orderNumber)}</h2>
  <p><strong>Customer:</strong> ${escapeHtml(ctx.customerName)}</p>
  <p><strong>Phone:</strong> <a href="${escapeHtml(phoneHref)}">${escapeHtml(ctx.customerPhone)}</a></p>
  ${ctx.customerEmail ? `<p><strong>Email:</strong> <a href="${escapeHtml(emailHref)}">${escapeHtml(ctx.customerEmail)}</a></p>` : ""}
  <p><strong>Address:</strong><br/>${escapeHtml(ctx.address.street)}<br/>${ctx.address.area ? escapeHtml(ctx.address.area) + "<br/>" : ""}${escapeHtml(ctx.address.city)}</p>
  <p><strong>Items:</strong><br/>${itemsText}</p>
  <p><strong>Total:</strong> ${money(ctx.total)}</p>
  <p><a href="${escapeHtml(url)}">Open order</a></p>
</body>
</html>`;

  return {
    to: internalTo,
    subject: `New order ${ctx.orderNumber} — ${money(ctx.total)}`,
    html,
    replyTo: ctx.customerEmail ?? undefined,
  };
}
