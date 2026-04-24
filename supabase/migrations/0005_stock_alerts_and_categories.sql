-- PAWS Egypt — stock alerts + Offers/Packages categories
-- Adds the back-in-stock waitlist table and two new top-level categories.

-- =====================
-- 1. stock_alerts
-- =====================
CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','notified','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  notified_at TIMESTAMPTZ,
  UNIQUE(product_id, email)
);

ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert stock_alerts" ON stock_alerts;
CREATE POLICY "Public can insert stock_alerts" ON stock_alerts
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can manage stock_alerts" ON stock_alerts;
CREATE POLICY "Staff can manage stock_alerts" ON stock_alerts
  USING (get_user_role() IN ('admin','manager','accountant'));

CREATE INDEX IF NOT EXISTS idx_stock_alerts_product_status
  ON stock_alerts(product_id, status);

-- =====================
-- 2. Offers + Packages categories
-- =====================
INSERT INTO categories (name_en, name_ar, sort_order, is_active)
VALUES
  ('Offers',   'عروض',  100, true),
  ('Packages', 'باكدج', 101, true)
ON CONFLICT DO NOTHING;
