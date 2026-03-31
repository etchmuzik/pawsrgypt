import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";

async function getSalesData() {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, total, subtotal, tax, status, created_at, customer:customers(name)")
    .eq("type", "sale")
    .order("created_at", { ascending: false })
    .limit(50);

  type Invoice = { id: string; total: number; subtotal: number; tax: number; status: string; created_at: string; customer: { name: string } | null };
  const all = (invoices as Invoice[] | null) ?? [];

  const totalRevenue = all.reduce((s, i) => s + (i.total ?? 0), 0);
  const paidInvoices = all.filter((i) => i.status === "paid");
  const pendingInvoices = all.filter((i) => i.status === "pending" || i.status === "draft");

  return { invoices: all, totalRevenue, paidCount: paidInvoices.length, pendingCount: pendingInvoices.length };
}

function fmt(n: number) {
  return n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-EG", { year: "numeric", month: "short", day: "numeric" });
}

export default async function SalesReportPage() {
  const locale = await getLocale();
  const data = await getSalesData();

  return (
    <div>
      <div className="mb-6">
        <Link href={`/${locale}/accounting/reports`} className="text-sm text-muted-foreground hover:text-paws-orange transition-colors">
          &larr; Back to Reports
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 mt-2">Sales Report</h1>
        <p className="text-sm text-muted-foreground mt-1">Sales breakdown and invoice summary</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">Total Revenue</span>
          <p className="text-2xl font-bold text-green-600 mt-2">{fmt(data.totalRevenue)} EGP</p>
        </Card>
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">Paid Invoices</span>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{data.paidCount}</p>
        </Card>
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">Pending Invoices</span>
          <p className="text-2xl font-bold text-paws-orange mt-2">{data.pendingCount}</p>
        </Card>
      </div>

      {data.invoices.length > 0 ? (
        <Card className="border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Customer</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 text-neutral-900">{formatDate(inv.created_at)}</td>
                  <td className="px-4 py-3 text-neutral-600">{inv.customer?.name ?? "Walk-in"}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium">{fmt(inv.total)} EGP</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="p-12 border-neutral-200 text-center">
          <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-900 mb-1">No sales yet</h3>
          <p className="text-sm text-muted-foreground">Create invoices to see sales data here.</p>
        </Card>
      )}
    </div>
  );
}
