\set ON_ERROR_STOP on
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE TABLE profiles(id uuid PRIMARY KEY,is_active boolean,role text);
CREATE TABLE website_orders(id uuid PRIMARY KEY,order_number text,status text);
CREATE TABLE website_order_payments(order_id uuid,method text,status text,environment text);
\ir ../supabase/migrations/20261029182036_website_order_controls.sql
INSERT INTO profiles VALUES ('11111111-1111-4111-8111-111111111111',true,'admin');
INSERT INTO website_orders VALUES ('22222222-2222-4222-8222-222222222222','WEB-COD','pending'),('33333333-3333-4333-8333-333333333333','WEB-ONLINE','pending'),('44444444-4444-4444-8444-444444444444','TEST-1','pending');
INSERT INTO website_order_payments VALUES ('33333333-3333-4333-8333-333333333333','fawaterak','pending','production');
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SELECT change_website_order_status('22222222-2222-4222-8222-222222222222','pending','confirmed');
DO $$ BEGIN
 BEGIN PERFORM change_website_order_status('22222222-2222-4222-8222-222222222222','pending','confirmed');RAISE EXCEPTION 'unexpected';EXCEPTION WHEN others THEN ASSERT SQLERRM LIKE '%Order changed%';END;
 BEGIN PERFORM change_website_order_status('22222222-2222-4222-8222-222222222222','confirmed','delivered');RAISE EXCEPTION 'unexpected';EXCEPTION WHEN others THEN ASSERT SQLERRM LIKE '%Invalid status%';END;
 BEGIN PERFORM change_website_order_status('33333333-3333-4333-8333-333333333333','pending','confirmed');RAISE EXCEPTION 'unexpected';EXCEPTION WHEN others THEN ASSERT SQLERRM LIKE '%payment must be verified%';END;
 BEGIN PERFORM change_website_order_status('44444444-4444-4444-8444-444444444444','pending','confirmed');RAISE EXCEPTION 'unexpected';EXCEPTION WHEN others THEN ASSERT SQLERRM LIKE '%Test orders%';END;
END $$;
SELECT change_website_order_status('22222222-2222-4222-8222-222222222222','confirmed','shipped');
SELECT change_website_order_status('22222222-2222-4222-8222-222222222222','shipped','delivered');
SELECT change_website_order_status('33333333-3333-4333-8333-333333333333','pending','cancelled');
DO $$ BEGIN
 ASSERT (SELECT count(*) FROM website_order_status_history)=4;
 ASSERT NOT has_function_privilege('anon','change_website_order_status(uuid,text,text)','EXECUTE');
 ASSERT NOT has_table_privilege('authenticated','website_order_status_history','INSERT');
 ASSERT NOT has_table_privilege('anon','website_order_notification_settings','SELECT');
END $$;
SELECT set_config('request.jwt.claim.sub','',false);
DO $$ BEGIN
 BEGIN PERFORM change_website_order_status('44444444-4444-4444-8444-444444444444','pending','cancelled');RAISE EXCEPTION 'unexpected';EXCEPTION WHEN others THEN ASSERT SQLERRM LIKE '%Not authorized%';END;
END $$;
SELECT 'Order transitions, audit history, payment/test guards, and permissions passed' AS result;
