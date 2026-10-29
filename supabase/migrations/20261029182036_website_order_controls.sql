CREATE TABLE public.website_order_status_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES public.website_orders(id),
 from_status text NOT NULL,to_status text NOT NULL,actor_id uuid NOT NULL REFERENCES public.profiles(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.website_order_status_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.website_order_status_history FROM anon,authenticated;
GRANT SELECT ON public.website_order_status_history TO authenticated;
CREATE POLICY staff_read_order_history ON public.website_order_status_history FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_active AND role IN ('admin','manager','cashier')));
CREATE INDEX ON public.website_order_status_history(order_id,created_at);
CREATE FUNCTION public.change_website_order_status(p_order_id uuid,p_expected text,p_status text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE current_order public.website_orders; payment public.website_order_payments;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_active AND role IN ('admin','manager','cashier')) THEN RAISE EXCEPTION 'Not authorized'; END IF;
 SELECT * INTO current_order FROM public.website_orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND OR current_order.status IS DISTINCT FROM p_expected THEN RAISE EXCEPTION 'Order changed. Refresh before trying again.'; END IF;
 IF NOT ((p_expected='pending' AND p_status IN ('confirmed','cancelled')) OR (p_expected='confirmed' AND p_status IN ('shipped','cancelled')) OR (p_expected='shipped' AND p_status='delivered')) THEN RAISE EXCEPTION 'Invalid status transition'; END IF;
 SELECT * INTO payment FROM public.website_order_payments WHERE order_id=p_order_id;
 IF p_status<>'cancelled' AND (current_order.order_number LIKE 'TEST-%' OR payment.environment='staging') THEN RAISE EXCEPTION 'Test orders cannot be fulfilled'; END IF;
 IF p_status<>'cancelled' AND payment.method='fawaterak' AND payment.status<>'paid' THEN RAISE EXCEPTION 'Online payment must be verified before fulfillment'; END IF;
 UPDATE public.website_orders SET status=p_status WHERE id=p_order_id;
 INSERT INTO public.website_order_status_history(order_id,from_status,to_status,actor_id) VALUES(p_order_id,p_expected,p_status,auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.change_website_order_status(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.change_website_order_status(uuid,text,text) TO authenticated;
CREATE TABLE public.website_order_notification_settings (
 id boolean PRIMARY KEY DEFAULT true CHECK(id),recipient text NOT NULL DEFAULT '',enabled boolean NOT NULL DEFAULT false,
 CHECK(length(recipient)<=254),updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.website_order_notification_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.website_order_notification_settings FROM anon,authenticated;
GRANT SELECT,UPDATE ON public.website_order_notification_settings TO authenticated;
GRANT ALL ON public.website_order_notification_settings TO service_role;
CREATE POLICY managers_read_order_notifications ON public.website_order_notification_settings FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_active AND role IN ('admin','manager')));
CREATE POLICY managers_update_order_notifications ON public.website_order_notification_settings FOR UPDATE TO authenticated USING(EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_active AND role IN ('admin','manager'))) WITH CHECK(EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_active AND role IN ('admin','manager')));
INSERT INTO public.website_order_notification_settings(id) VALUES(true);
