import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { resolveRange } from "@/lib/report-dates";
import { ReportDateFilter } from "@/components/dashboard/ReportDateFilter";

interface SalesReportPageProps {
  searchParams: Promise<{ range?: string }>;
}

interface Invoice {
  id: string;
  total: number;
  subtotal: number;
  tax_amount: number;
  paid: number;
  status: string;
  created_at: string;
  customers: { name: string } | null;
}

async function getSalesData(from: string, to: string) {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, total, subtotal, tax_amount, paid, status, created_at, customers(name)")
    .eq("type", "sale")
    .gte("created_at", from)
    .lte("created_at", `${to}T23:59:59`)
    .order("created_at", { ascending: false })
    .limit(200);

  const all = (invoices as Invoice[] | null) ?? [];
  const totalRevenue = all.reduce((s, i) => s + (i.total ?? 0), 0);
  const totalCollected = all.reduce((s, i) => s + (i.paid ?? 0), 0);
  const paidCount = all.filter((i) => i.status === "paid").length;
  const outstandingCount = all.filter((i) => i.status === "confirmed" || i.status === "partial").length;
  const outstanding = all
    .filter((i) => i.status !== "cancelled")
    .reduce((s, i) => s + Math.max(0, (i.total ?? 0) - (i.paid ?? 0)), 0);

  return { invoices: all, totalRevenue, totalCollected, paidCount, outstandingCount, outstanding };
}

function fmt(n: number) {
  return n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-EG", { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  partial: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  draft: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

export default async function SalesReportPage({ searchParams }: SalesReportPageProps) {
  const locale = await getLocale();
  const params = await searchParams;
  const range = resolveRange(params.range);
  const data = await getSalesData(range.from, range.to);

  return (
    <div>
      <div className="mb-6">
        <Link href={`/${locale}/accounting/reports`} className="text-sm text-muted-foreground hover:text-paws-orange transition-colors">
          &larr; Back to Reports
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 mt-2">Sales Report</h1>
        <p className="text-sm text-muted-foreground mt-1">Invoice breakdown and collection status</p>
      </div>

      <ReportDateFilter basePath={`/${locale}/accounting/reports/sales`} current={range.preset} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">Total Revenue</span>
          <p className="text-2xl font-bold text-green-600 mt-2">{fmt(data.totalRevenue)} <span className="text-sm font-normal text-muted-foreground">EGP</span></p>
        </Card>
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">Collected</span>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{fmt(data.totalCollected)} <span className="text-sm font-normal text-muted-foreground">EGP</span></p>
        </Card>
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">Outstanding</span>
          <p className="text-2xl font-bold text-paws-orange mt-2">{fmt(data.outstanding)} <span className="text-sm font-normal text-muted-foreground">EGP</span></p>
        </Card>
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">Invoices</span>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{data.invoices.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{data.paidCount} paid · {data.outstandingCount} open</p>
        </Card>
      </div>

      {data.invoices.length > 0 ? (
        <Card className="border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Customer</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Subtotal</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Tax</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Paid</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 text-neutral-900">{formatDate(inv.created_at)}</td>
                    <td className="px-4 py-3 text-neutral-600">{inv.customers?.name ?? "Walk-in"}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(inv.subtotal)}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">{fmt(inv.tax_amount)}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{fmt(inv.total)}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-700">{fmt(inv.paid)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-12 border-neutral-200 text-center">
          <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-900 mb-1">No sales in this period</h3>
          <p className="text-sm text-muted-foreground">Try widening the date range.</p>
        </Card>
      )}
    </div>
  );
}
