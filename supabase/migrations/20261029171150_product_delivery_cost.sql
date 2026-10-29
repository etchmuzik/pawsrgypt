ALTER TABLE public.products ADD COLUMN delivery_cost numeric(8,2) NOT NULL DEFAULT 0 CHECK (delivery_cost >= 0 AND delivery_cost <= 999999.99);
COMMENT ON COLUMN public.products.delivery_cost IS 'Manually maintained delivery cost in EGP; checkout activation requires a cart aggregation rule.';
