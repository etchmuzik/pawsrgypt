\set ON_ERROR_STOP on
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE TABLE public.website_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL, customer_email text, customer_phone text,
  shipping_address jsonb, items jsonb,
  subtotal numeric(12,2), shipping numeric(12,2), total numeric(12,2), status text
);
ALTER TABLE public.website_orders ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.website_orders TO service_role;
GRANT SELECT, INSERT ON public.website_orders TO anon;
CREATE POLICY "Public can insert website_orders" ON public.website_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read website_order by token" ON public.website_orders FOR SELECT USING (true);
CREATE POLICY "Public read website_orders by access token" ON public.website_orders FOR SELECT USING (access_token IS NOT NULL);
\ir ../supabase/migrations/20261027195424_fawaterak_payments.sql

SET ROLE service_role;
SELECT * FROM public.create_website_checkout('11111111-1111-4111-8111-111111111111',
  '{"order_number":"TEST-1","customer_name":"Test Customer","customer_email":"test@example.invalid","customer_phone":"01000000000","shipping_address":{"city":"Cairo"},"items":[],"subtotal":100,"shipping":0,"total":114}', 'fawaterak','staging');
DO $$ BEGIN
  ASSERT (SELECT count(*) FROM public.website_orders) = 1;
  ASSERT (SELECT count(*) FROM public.website_order_payments WHERE status='initializing') = 1;
  -- A failed payment insert must roll back its associated order.
  BEGIN
    PERFORM public.create_website_checkout(gen_random_uuid(),
      '{"order_number":"TEST-ROLLBACK","customer_name":"Test","subtotal":100,"shipping":0,"total":114}', 'invalid','staging');
    RAISE EXCEPTION 'expected check violation';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  ASSERT (SELECT count(*) FROM public.website_orders) = 1;
  BEGIN
    PERFORM public.create_website_checkout('11111111-1111-4111-8111-111111111111',
      '{"order_number":"TEST-DUPLICATE","customer_name":"Test","subtotal":100,"shipping":0,"total":114}', 'cod',null);
    RAISE EXCEPTION 'expected unique violation';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  ASSERT (SELECT count(*) FROM public.website_orders) = 1;
END $$;
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN
  ASSERT (SELECT count(*) FROM public.website_orders) = 0;
  ASSERT NOT has_table_privilege('anon','public.website_order_payments','SELECT');
  ASSERT NOT has_function_privilege('anon','public.create_website_checkout(uuid,jsonb,text,text)','EXECUTE');
END $$;
RESET ROLE;
SELECT 'Payment transaction, retry uniqueness, rollback, and guest isolation passed' AS result;
