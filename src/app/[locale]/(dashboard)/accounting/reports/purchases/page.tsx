import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Package } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { resolveRange } from "@/lib/report-dates";
import { ReportDateFilter } from "@/components/dashboard/ReportDateFilter";

interface PurchaseReportPageProps {
  searchParams: Promise<{ range?: string }>;
}

interface PO {
  id: string;
  total: number;
  subtotal: number;
  tax_amount: number;
  status: string;
  created_at: string;
  suppliers: { name: string } | null;
}

async function getPurchaseData(from: string, to: string) {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("purchase_orders")
    .select("id, total, subtotal, tax_amount, status, created_at, suppliers(name)")
    .gte("created_at", from)
    .lte("created_at", `${to}T23:59:59`)
    .order("created_at", { ascending: false })
    .limit(200);

  const all = (orders as PO[] | null) ?? [];
  const totalSpend = all
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + (o.total ?? 0), 0);
  const receivedCount = all.filter((o) => o.status === "received").length;
  const pendingCount = all.filter((o) => o.status === "draft" || o.status === "ordered").length;
  const cancelledCount = all.filter((o) => o.status === "cancelled").length;

  return { orders: all, totalSpend, receivedCount, pendingCount, cancelledCount };
}

function fmt(n: number) {
  return n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-EG", { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  received: "bg-green-100 text-green-700",
  ordered: "bg-blue-100 text-blue-700",
  draft: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

export default async function PurchasesReportPage({ searchParams }: PurchaseReportPageProps) {
  const locale = await getLocale();
  const params = await searchParams;
  const range = resolveRange(params.range);
  const data = await getPurchaseData(range.from, range.to);

  return (
    <div>
      <div className="mb-6">
        <Link href={`/${locale}/accounting/reports`} className="text-sm text-muted-foreground hover:text-paws-orange transition-colors">
          &larr; Back to Reports
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 mt-2">Purchase Report</h1>
        <p className="text-sm text-muted-foreground mt-1">Purchase orders and supplier spending</p>
      </div>

      <ReportDateFilter basePath={`/${locale}/accounting/reports/purchases`} current={range.preset} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">Total Spend</span>
          <p className="text-2xl font-bold text-teal-600 mt-2">{fmt(data.totalSpend)} <span className="text-sm font-normal text-muted-foreground">EGP</span></p>
          <p className="text-xs text-muted-foreground mt-1">excludes cancelled</p>
        </Card>
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">Received</span>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{data.receivedCount}</p>
        </Card>
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">Open</span>
          <p className="text-2xl font-bold text-paws-orange mt-2">{data.pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-1">draft or ordered</p>
        </Card>
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">Cancelled</span>
          <p className="text-2xl font-bold text-muted-foreground mt-2">{data.cancelledCount}</p>
        </Card>
      </div>

      {data.orders.length > 0 ? (
        <Card className="border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Supplier</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Subtotal</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Tax</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.orders.map((o) => (
                  <tr key={o.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 text-neutral-900">{formatDate(o.created_at)}</td>
                    <td className="px-4 py-3 text-neutral-600">{o.suppliers?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(o.subtotal)}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">{fmt(o.tax_amount)}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{fmt(o.total)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {o.status}
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
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-900 mb-1">No purchases in this period</h3>
          <p className="text-sm text-muted-foreground">Try widening the date range.</p>
        </Card>
      )}
    </div>
  );
}
