-- PAWS Egypt — Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE grooming_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get current user's branch
CREATE OR REPLACE FUNCTION get_user_branch()
RETURNS UUID AS $$
  SELECT branch_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Public read access for website (categories, products)
CREATE POLICY "Public can read categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read product_variants" ON product_variants FOR SELECT USING (is_active = true);
CREATE POLICY "Public can insert grooming_bookings" ON grooming_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can insert website_orders" ON website_orders FOR INSERT WITH CHECK (true);

-- Authenticated users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());

-- Admin has full access to everything
CREATE POLICY "Admin full access branches" ON branches USING (get_user_role() = 'admin');
CREATE POLICY "Admin full access profiles" ON profiles USING (get_user_role() = 'admin');
CREATE POLICY "Admin full access categories" ON categories USING (get_user_role() IN ('admin','manager'));
CREATE POLICY "Admin full access products" ON products USING (get_user_role() IN ('admin','manager','cashier','warehouse'));
CREATE POLICY "Admin full access variants" ON product_variants USING (get_user_role() IN ('admin','manager','cashier','warehouse'));
CREATE POLICY "Admin full access warehouses" ON warehouses USING (get_user_role() IN ('admin','manager','warehouse'));
CREATE POLICY "Admin full access stock" ON stock USING (get_user_role() IN ('admin','manager','warehouse','cashier'));
CREATE POLICY "Admin full access stock_movements" ON stock_movements USING (get_user_role() IN ('admin','manager','warehouse'));
CREATE POLICY "Admin full access suppliers" ON suppliers USING (get_user_role() IN ('admin','manager','accountant'));
CREATE POLICY "Admin full access purchase_orders" ON purchase_orders USING (get_user_role() IN ('admin','manager','accountant'));
CREATE POLICY "Admin full access purchase_items" ON purchase_items USING (get_user_role() IN ('admin','manager','accountant'));
CREATE POLICY "Admin full access customers" ON customers USING (get_user_role() IN ('admin','manager','cashier'));
CREATE POLICY "Admin full access invoices" ON invoices USING (get_user_role() IN ('admin','manager','cashier','accountant'));
CREATE POLICY "Admin full access invoice_items" ON invoice_items USING (get_user_role() IN ('admin','manager','cashier','accountant'));
CREATE POLICY "Admin full access payments" ON payments USING (get_user_role() IN ('admin','manager','cashier','accountant'));
CREATE POLICY "Admin full access accounts" ON chart_of_accounts USING (get_user_role() IN ('admin','accountant'));
CREATE POLICY "Admin full access journal" ON journal_entries USING (get_user_role() IN ('admin','accountant'));
CREATE POLICY "Admin full access journal_lines" ON journal_lines USING (get_user_role() IN ('admin','accountant'));
CREATE POLICY "Admin full access treasury" ON treasury_accounts USING (get_user_role() IN ('admin','accountant'));
CREATE POLICY "Admin full access employees" ON employees USING (get_user_role() IN ('admin','manager','hr'));
CREATE POLICY "Admin full access attendance" ON attendance USING (get_user_role() IN ('admin','manager','hr'));
CREATE POLICY "Admin full access payroll" ON payroll USING (get_user_role() IN ('admin','hr'));
CREATE POLICY "Admin full access bookings" ON grooming_bookings USING (get_user_role() IN ('admin','manager','cashier'));
CREATE POLICY "Admin full access website_orders" ON website_orders USING (get_user_role() IN ('admin','manager','cashier'));
CREATE POLICY "Admin full access settings" ON system_settings USING (get_user_role() = 'admin');
