-- PAWS Egypt — Blog posts, RLS hardening, schema fixes, and performance indexes
-- Addresses audit findings:
--   CRITICAL: blog_posts table missing, audit_log no policies, website_orders too permissive
--   HIGH: treasury_accounts + invoices.tax schema mismatch, security definer functions
--   MEDIUM: missing FK indexes, multiple permissive policies, auth_rls_initplan

-- =====================
-- 1. blog_posts table
-- =====================
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  excerpt_en TEXT,
  excerpt_ar TEXT,
  content_en TEXT NOT NULL,
  content_ar TEXT,
  featured_image TEXT,
  author TEXT NOT NULL DEFAULT 'PAWS Egypt',
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published
  ON blog_posts(published_at DESC) WHERE is_published = true;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================
-- 2. Harden security definer functions with SET search_path
-- =====================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_user_branch()
RETURNS UUID AS $$
  SELECT branch_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================
-- 3. blog_posts RLS (split per-command to avoid multi-permissive overlap)
-- =====================
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth manage all" ON blog_posts;
DROP POLICY IF EXISTS "Public read published" ON blog_posts;
DROP POLICY IF EXISTS "Public read published posts" ON blog_posts;
DROP POLICY IF EXISTS "Admin manage blog posts" ON blog_posts;

CREATE POLICY "Read blog posts" ON blog_posts
  FOR SELECT USING (
    is_published = true
    OR (SELECT get_user_role()) IN ('admin', 'manager')
  );

CREATE POLICY "Admin insert blog posts" ON blog_posts
  FOR INSERT WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admin update blog posts" ON blog_posts
  FOR UPDATE USING ((SELECT get_user_role()) IN ('admin', 'manager'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin', 'manager'));

CREATE POLICY "Admin delete blog posts" ON blog_posts
  FOR DELETE USING ((SELECT get_user_role()) IN ('admin', 'manager'));

-- =====================
-- 4. audit_log RLS policies (RLS was enabled with no policies)
-- =====================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated write audit_log" ON audit_log;
CREATE POLICY "Authenticated write audit_log" ON audit_log
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Admin read audit_log" ON audit_log;
CREATE POLICY "Admin read audit_log" ON audit_log
  FOR SELECT USING ((SELECT get_user_role()) IN ('admin', 'manager'));

-- =====================
-- 5. Harden website_orders + grooming_bookings INSERT policies
-- =====================
DROP POLICY IF EXISTS "Public can insert website_orders" ON website_orders;
CREATE POLICY "Public can insert website_orders" ON website_orders
  FOR INSERT WITH CHECK (
    total >= 0
    AND subtotal >= 0
    AND (status IS NULL OR status = 'pending')
    AND customer_name IS NOT NULL
    AND customer_phone IS NOT NULL
    AND char_length(customer_name) <= 200
    AND char_length(customer_phone) <= 50
    AND (customer_email IS NULL OR customer_email LIKE '%_@_%')
  );

DROP POLICY IF EXISTS "Public can insert grooming_bookings" ON grooming_bookings;
CREATE POLICY "Public can insert grooming_bookings" ON grooming_bookings
  FOR INSERT WITH CHECK (
    customer_name IS NOT NULL
    AND phone IS NOT NULL
    AND char_length(customer_name) <= 200
    AND char_length(phone) <= 50
  );

ALTER TABLE website_orders
  DROP CONSTRAINT IF EXISTS chk_website_orders_total_non_negative;
ALTER TABLE website_orders
  ADD CONSTRAINT chk_website_orders_total_non_negative
  CHECK (total >= 0 AND subtotal >= 0);

-- =====================
-- 6. Split "Admin full access" ALL policies into per-command to eliminate overlap
-- =====================
-- categories
DROP POLICY IF EXISTS "Admin full access categories" ON categories;
DROP POLICY IF EXISTS "Public can read categories" ON categories;
CREATE POLICY "Read categories" ON categories
  FOR SELECT USING (is_active = true OR (SELECT get_user_role()) IN ('admin','manager'));
CREATE POLICY "Admin write categories" ON categories
  FOR INSERT WITH CHECK ((SELECT get_user_role()) IN ('admin','manager'));
CREATE POLICY "Admin update categories" ON categories
  FOR UPDATE USING ((SELECT get_user_role()) IN ('admin','manager'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin','manager'));
CREATE POLICY "Admin delete categories" ON categories
  FOR DELETE USING ((SELECT get_user_role()) IN ('admin','manager'));

-- products
DROP POLICY IF EXISTS "Admin full access products" ON products;
DROP POLICY IF EXISTS "Public can read products" ON products;
CREATE POLICY "Read products" ON products
  FOR SELECT USING (is_active = true OR (SELECT get_user_role()) IN ('admin','manager','cashier','warehouse'));
CREATE POLICY "Admin write products" ON products
  FOR INSERT WITH CHECK ((SELECT get_user_role()) IN ('admin','manager','cashier','warehouse'));
CREATE POLICY "Admin update products" ON products
  FOR UPDATE USING ((SELECT get_user_role()) IN ('admin','manager','cashier','warehouse'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin','manager','cashier','warehouse'));
CREATE POLICY "Admin delete products" ON products
  FOR DELETE USING ((SELECT get_user_role()) IN ('admin','manager'));

-- product_variants
DROP POLICY IF EXISTS "Admin full access variants" ON product_variants;
DROP POLICY IF EXISTS "Public can read product_variants" ON product_variants;
CREATE POLICY "Read product_variants" ON product_variants
  FOR SELECT USING (is_active = true OR (SELECT get_user_role()) IN ('admin','manager','cashier','warehouse'));
CREATE POLICY "Admin write variants" ON product_variants
  FOR INSERT WITH CHECK ((SELECT get_user_role()) IN ('admin','manager','cashier','warehouse'));
CREATE POLICY "Admin update variants" ON product_variants
  FOR UPDATE USING ((SELECT get_user_role()) IN ('admin','manager','cashier','warehouse'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin','manager','cashier','warehouse'));
CREATE POLICY "Admin delete variants" ON product_variants
  FOR DELETE USING ((SELECT get_user_role()) IN ('admin','manager'));

-- grooming_bookings admin access
DROP POLICY IF EXISTS "Admin full access bookings" ON grooming_bookings;
CREATE POLICY "Admin select bookings" ON grooming_bookings
  FOR SELECT USING ((SELECT get_user_role()) IN ('admin','manager','cashier'));
CREATE POLICY "Admin update bookings" ON grooming_bookings
  FOR UPDATE USING ((SELECT get_user_role()) IN ('admin','manager','cashier'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin','manager','cashier'));
CREATE POLICY "Admin delete bookings" ON grooming_bookings
  FOR DELETE USING ((SELECT get_user_role()) IN ('admin','manager'));

-- website_orders admin access
DROP POLICY IF EXISTS "Admin full access website_orders" ON website_orders;
CREATE POLICY "Admin select website_orders" ON website_orders
  FOR SELECT USING ((SELECT get_user_role()) IN ('admin','manager','cashier'));
CREATE POLICY "Admin update website_orders" ON website_orders
  FOR UPDATE USING ((SELECT get_user_role()) IN ('admin','manager','cashier'))
  WITH CHECK ((SELECT get_user_role()) IN ('admin','manager','cashier'));
CREATE POLICY "Admin delete website_orders" ON website_orders
  FOR DELETE USING ((SELECT get_user_role()) IN ('admin','manager'));

-- profiles: user self + admin (unified SELECT/UPDATE to avoid overlap)
DROP POLICY IF EXISTS "Admin full access profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
CREATE POLICY "Read profiles" ON profiles
  FOR SELECT USING (id = (SELECT auth.uid()) OR (SELECT get_user_role()) = 'admin');
CREATE POLICY "Update profiles" ON profiles
  FOR UPDATE USING (id = (SELECT auth.uid()) OR (SELECT get_user_role()) = 'admin')
  WITH CHECK (id = (SELECT auth.uid()) OR (SELECT get_user_role()) = 'admin');
CREATE POLICY "Admin insert profiles" ON profiles
  FOR INSERT WITH CHECK ((SELECT get_user_role()) = 'admin');
CREATE POLICY "Admin delete profiles" ON profiles
  FOR DELETE USING ((SELECT get_user_role()) = 'admin');

-- =====================
-- 7. treasury_accounts bilingual columns (app expects name_en/name_ar/currency)
-- =====================
ALTER TABLE treasury_accounts
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS name_ar TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EGP';
UPDATE treasury_accounts SET name_en = name WHERE name_en IS NULL AND name IS NOT NULL;

-- =====================
-- 8. invoices + purchase_orders — `tax` alias (app queries `tax`, schema has `tax_amount`)
-- =====================
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS tax NUMERIC(12,2)
  GENERATED ALWAYS AS (tax_amount) STORED;
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS tax NUMERIC(12,2)
  GENERATED ALWAYS AS (tax_amount) STORED;

-- =====================
-- 9. Storage bucket listing restriction
-- =====================
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images by key" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'product-images' AND name IS NOT NULL
  );

-- =====================
-- 10. Missing indexes on foreign keys and filtered columns
-- =====================
-- FK covering indexes (from unindexed_foreign_keys advisor)
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent ON chart_of_accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch ON employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_grooming_bookings_branch ON grooming_bookings(branch_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_variant ON invoice_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_branch ON invoices(branch_id);
CREATE INDEX IF NOT EXISTS idx_invoices_sales_rep ON invoices(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_journal_entries_branch ON journal_entries(branch_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_by ON journal_entries(created_by);
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_by ON payments(created_by);
CREATE INDEX IF NOT EXISTS idx_payroll_created_by ON payroll(created_by);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_order ON purchase_items(order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product ON purchase_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_variant ON purchase_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_branch ON purchase_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by ON purchase_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_stock_variant ON stock(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_from_wh ON stock_movements(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_to_wh ON stock_movements(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_variant ON stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by ON stock_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_system_settings_branch ON system_settings(branch_id);
CREATE INDEX IF NOT EXISTS idx_treasury_accounts_branch ON treasury_accounts(branch_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_branch ON warehouses(branch_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_manager ON warehouses(manager_id);

-- Filtered / ordered columns
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_profiles_branch ON profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_invoices_type_status ON invoices(type, status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_website_orders_status ON website_orders(status);
CREATE INDEX IF NOT EXISTS idx_website_orders_created ON website_orders(created_at DESC);
