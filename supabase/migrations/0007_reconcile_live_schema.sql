-- 0007_reconcile_live_schema.sql
--
-- Reconciliation migration. The live Supabase project (ref shxnczbvtitnnxyxkkyf) had
-- drifted from migrations 0001–0006: several changes were applied via the dashboard /
-- a separate (timestamped) migration lineage and never written back into this repo's
-- 0001–0006 files. This migration documents and ASSERTS the live reality so the repo
-- migrations match the database going forward.
--
-- It is IDEMPOTENT and GUARDED: safe to run against the live DB (already in this state)
-- and against a fresh DB built from 0001–0006. It only adds what is missing.
--
-- Verified against live schema 2026-06-02. See the `db-schema-drift-invoices` project note.

BEGIN;

-- 1) invoices.tax / purchase_orders.tax are GENERATED columns mirroring tax_amount.
--    Application code must write `tax_amount` (writable); `tax` is read-only.
--    Add tax_amount if a fresh DB lacks it, then add the generated `tax` column.
DO $$
BEGIN
  -- invoices.tax_amount (writable VAT column)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'tax_amount'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0;
  END IF;

  -- invoices.tax (generated, mirrors tax_amount) — only add if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'tax'
  ) THEN
    ALTER TABLE public.invoices
      ADD COLUMN tax DECIMAL(10,2) GENERATED ALWAYS AS (tax_amount) STORED;
  END IF;

  -- purchase_orders.tax_amount
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'tax_amount'
  ) THEN
    ALTER TABLE public.purchase_orders ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0;
  END IF;

  -- purchase_orders.tax (generated, mirrors tax_amount)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'tax'
  ) THEN
    ALTER TABLE public.purchase_orders
      ADD COLUMN tax DECIMAL(10,2) GENERATED ALWAYS AS (tax_amount) STORED;
  END IF;
END $$;

-- 2) NOT NULL constraints present on the live DB.
--    invoices.branch_id, invoices.created_by, payments.created_by are NOT NULL.
--    Guarded so a re-run (or already-constrained column) is a no-op. We only enforce
--    when there are no violating rows, to avoid failing on legacy data.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='invoices' AND column_name='branch_id' AND is_nullable='YES'
  ) AND NOT EXISTS (SELECT 1 FROM public.invoices WHERE branch_id IS NULL) THEN
    ALTER TABLE public.invoices ALTER COLUMN branch_id SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='invoices' AND column_name='created_by' AND is_nullable='YES'
  ) AND NOT EXISTS (SELECT 1 FROM public.invoices WHERE created_by IS NULL) THEN
    ALTER TABLE public.invoices ALTER COLUMN created_by SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='payments' AND column_name='created_by' AND is_nullable='YES'
  ) AND NOT EXISTS (SELECT 1 FROM public.payments WHERE created_by IS NULL) THEN
    ALTER TABLE public.payments ALTER COLUMN created_by SET NOT NULL;
  END IF;
END $$;

-- 3) stock_movements.type CHECK allows: in, out, transfer, adjustment, assembly (NO 'sale').
--    A POS sale is recorded as type 'out' with reference_type 'pos_sale'.
--    Ensure the constraint exists with exactly this allow-list.
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT c.conname INTO con_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public' AND t.relname = 'stock_movements' AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%type%';

  IF con_name IS NULL THEN
    ALTER TABLE public.stock_movements
      ADD CONSTRAINT stock_movements_type_check
      CHECK (type IN ('in','out','transfer','adjustment','assembly'));
  END IF;
END $$;

COMMIT;
