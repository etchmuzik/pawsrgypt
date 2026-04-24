import { NextResponse } from "next/server";

/**
 * Public endpoint for customers to sign up for back-in-stock alerts.
 *
 * We hit the Supabase REST endpoint directly with the publishable anon key
 * rather than going through @supabase/ssr. On Netlify's Next.js runtime
 * the SSR client's cookie-based auth resolution ends up using a role that
 * doesn't map cleanly to Postgres 'anon' — causing our public INSERT
 * RLS policy to reject the write. A plain fetch with the anon key
 * matches the role and works.
 */

interface StockAlertInput {
  productId?: string;
  variantId?: string | null;
  email?: string;
  phone?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: StockAlertInput;
  try {
    body = (await request.json()) as StockAlertInput;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const productId = body.productId?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.trim() || null;
  const variantId = body.variantId?.trim() || null;

  if (!productId) {
    return NextResponse.json({ ok: false, error: "productId is required" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Valid email is required" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: "Server misconfigured" },
      { status: 500 },
    );
  }

  const res = await fetch(`${url}/rest/v1/stock_alerts`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      product_id: productId,
      variant_id: variantId,
      email,
      phone,
      status: "pending",
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json(
      { ok: false, error: `supabase ${res.status}: ${detail.slice(0, 200)}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
