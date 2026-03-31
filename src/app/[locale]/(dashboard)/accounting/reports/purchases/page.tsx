import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Package } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";

async function getPurchaseData() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("purchase_orders")
    .select("id, total, subtotal, tax, status, created_at, supplier:suppliers(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  type PO = { id: string; total: number; subtotal: number; tax: number; status: string; created_at: string; supplier: { name: string } | null };
  const all = (orders as PO[] | null) ?? [];

  const totalSpend = all.reduce((s, o) => s + (o.total ?? 0), 0);
  const receivedOrders = all.filter((o) => o.status === "received");
  const pendingOrders = all.filter((o) => o.status === "pending" || o.status === "draft");

  return { orders: all, totalSpend, receivedCount: receivedOrders.length, pendingCount: pendingOrders.length };
}

function fmt(n: number) {
  return n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-EG", { year: "numeric", month: "short", day: "numeric" });
}

export default async function PurchaseReportPage() {
  const locale = await getLocale();
  const data = await getPurchaseData();

  return (
    <div>
      <div className="mb-6">
        <Link href={`/${locale}/accounting/reports`} className="text-sm text-muted-foreground hover:text-paws-orange transition-colors">
          &larr; Back to Reports
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 mt-2">Purchase Report</h1>
        <p className="text-sm text-muted-foreground mt-1">Purchase orders and supplier spending</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">Total Spend</span>
          <p className="text-2xl font-bold text-red-600 mt-2">{fmt(data.totalSpend)} EGP</p>
        </Card>
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">Received Orders</span>
          <p className="text-2xl font-bold text-green-600 mt-2">{data.receivedCount}</p>
        </Card>
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">Pending Orders</span>
          <p className="text-2xl font-bold text-paws-orange mt-2">{data.pendingCount}</p>
        </Card>
      </div>

      {data.orders.length > 0 ? (
        <Card className="border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Supplier</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.orders.map((po) => (
                <tr key={po.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 text-neutral-900">{formatDate(po.created_at)}</td>
                  <td className="px-4 py-3 text-neutral-600">{po.supplier?.name ?? "Unknown"}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium">{fmt(po.total)} EGP</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${po.status === "received" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {po.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="p-12 border-neutral-200 text-center">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-900 mb-1">No purchase orders yet</h3>
          <p className="text-sm text-muted-foreground">Create purchase orders to see spending data.</p>
        </Card>
      )}
    </div>
  );
}
