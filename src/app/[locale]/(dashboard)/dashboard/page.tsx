import { createClient } from "@/lib/supabase/server";
import { TrendingUp, ShoppingCart, Package, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

async function getStats() {
  const supabase = await createClient();

  const [ordersResult, productsResult, customersResult] = await Promise.all([
    supabase.from("invoices").select("total, created_at").eq("type", "sale"),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("customers").select("id", { count: "exact", head: true }),
  ]);

  type OrderRow = { total: number; created_at: string };
  const orders = (ordersResult.data as OrderRow[] | null) ?? [];
  const today = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter((o) => o.created_at.startsWith(today));
  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  return {
    totalSales,
    ordersToday: todayOrders.length,
    totalProducts: productsResult.count ?? 0,
    totalCustomers: customersResult.count ?? 0,
  } as const;
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    {
      label: "Total Sales",
      value: `${stats.totalSales.toLocaleString()} EGP`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Orders Today",
      value: stats.ordersToday,
      icon: ShoppingCart,
      color: "text-paws-orange",
      bg: "bg-orange-50",
    },
    {
      label: "Products",
      value: stats.totalProducts,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-paws-brown-dark mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map((card) => (
          <Card key={card.label} className="p-5 border-paws-sand">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-paws-brown-dark">{card.value}</p>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-paws-brown-dark mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "New Invoice", href: "/sales/new", emoji: "🧾" },
          { label: "Add Product", href: "/products/new", emoji: "📦" },
          { label: "Open POS", href: "/pos", emoji: "🖥️" },
          { label: "View Reports", href: "/accounting/reports", emoji: "📊" },
        ].map((action) => (
          <a
            key={action.label}
            href={action.href}
            className="bg-white border border-paws-sand rounded-2xl p-4 text-center hover:border-paws-orange hover:shadow-sm transition-all"
          >
            <div className="text-3xl mb-2">{action.emoji}</div>
            <p className="text-sm font-medium text-paws-brown-dark">{action.label}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
