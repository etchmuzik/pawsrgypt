import { createClient } from "@/lib/supabase/server";
import { TrendingUp, ShoppingCart, Package, Users, FileText, PlusCircle, Monitor, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

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
  const locale = await getLocale();
  const t = await getTranslations("dashboard");
  const tCommon = await getTranslations("common");

  const cards = [
    { label: t("total_sales"), value: `${stats.totalSales.toLocaleString()} ${tCommon("egp")}`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: t("orders_today"), value: stats.ordersToday, icon: ShoppingCart, color: "text-paws-orange", bg: "bg-orange-50" },
    { label: t("products_count"), value: stats.totalProducts, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: t("customers_count"), value: stats.totalCustomers, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">{t("title")}</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map((card) => (
          <Card key={card.label} className="p-5 border-neutral-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{card.value}</p>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">{t("quick_actions")}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t("new_invoice"), href: `/${locale}/sales/new`, icon: FileText, color: "text-blue-600 bg-blue-50" },
          { label: t("add_product"), href: `/${locale}/products/new`, icon: PlusCircle, color: "text-green-600 bg-green-50" },
          { label: t("open_pos"), href: `/${locale}/pos`, icon: Monitor, color: "text-purple-600 bg-purple-50" },
          { label: t("view_reports"), href: `/${locale}/accounting`, icon: BarChart3, color: "text-orange-600 bg-orange-50" },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="bg-white border border-neutral-200 rounded-2xl p-4 text-center hover:border-paws-orange hover:shadow-sm transition-all"
          >
            <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2 ${action.color}`}>
              <action.icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-neutral-800">{action.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
