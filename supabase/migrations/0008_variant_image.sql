-- 0008_variant_image.sql
-- Per-weight variant images: an optional image per product_variant.
-- NULL means "fall back to the product's main image". Guarded + idempotent.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_variants'
      AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.product_variants ADD COLUMN image_url TEXT;
  END IF;
END $$;

COMMIT;
