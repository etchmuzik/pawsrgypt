-- Server-owned orders and payment sessions. Apply before deploying the new API.
ALTER TABLE public.website_orders ADD COLUMN IF NOT EXISTS checkout_request_id uuid;
-- The storefront already offers optional email for guest checkout.
ALTER TABLE public.website_orders ALTER COLUMN customer_email DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS website_orders_checkout_request_id_key ON public.website_orders(checkout_request_id);
-- Browser inserts would bypass catalog pricing; the order token is checked on the server.
DROP POLICY IF EXISTS "Public can insert website_orders" ON public.website_orders;
DROP POLICY IF EXISTS "Public read website_order by token" ON public.website_orders;

CREATE TABLE public.website_order_payments (
  order_id uuid PRIMARY KEY REFERENCES public.website_orders(id) ON DELETE RESTRICT,
  method text NOT NULL CHECK (method IN ('cod', 'fawaterak')),
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'initializing', 'pending', 'failed', 'paid')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'EGP' CHECK (currency = 'EGP'),
  environment text CHECK (environment IN ('staging', 'production')),
  invoice_id text UNIQUE,
  invoice_key text,
  checkout_url text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.website_order_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.website_order_payments FROM anon, authenticated;
GRANT ALL ON public.website_order_payments TO service_role;
-- No public policies: invoice keys and payment state are server-owned.

-- Both inserts commit together. Only the server service role may call this.
CREATE FUNCTION public.create_website_checkout(p_request_id uuid, p_order jsonb, p_method text, p_environment text)
RETURNS TABLE (id uuid, access_token uuid, order_number text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE created public.website_orders;
BEGIN
  INSERT INTO public.website_orders (
    checkout_request_id, order_number, customer_name, customer_email,
    customer_phone, shipping_address, items, subtotal, shipping, total, status
  ) VALUES (
    p_request_id, p_order->>'order_number', p_order->>'customer_name',
    p_order->>'customer_email', p_order->>'customer_phone',
    p_order->'shipping_address', p_order->'items',
    (p_order->>'subtotal')::numeric, (p_order->>'shipping')::numeric,
    (p_order->>'total')::numeric, 'pending'
  ) RETURNING * INTO created;
  INSERT INTO public.website_order_payments (order_id, method, status, amount, environment)
  VALUES (created.id, p_method, CASE WHEN p_method = 'fawaterak' THEN 'initializing' ELSE 'unpaid' END, created.total, p_environment);
  RETURN QUERY SELECT created.id, created.access_token, created.order_number;
END;
$$;
REVOKE ALL ON FUNCTION public.create_website_checkout(uuid, jsonb, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_website_checkout(uuid, jsonb, text, text) TO service_role;
