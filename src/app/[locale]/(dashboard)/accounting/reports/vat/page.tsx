import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { resolveRange } from "@/lib/report-dates";
import { ReportDateFilter } from "@/components/dashboard/ReportDateFilter";

interface VATReportPageProps {
  searchParams: Promise<{ range?: string }>;
}

interface Row {
  subtotal: number;
  tax_amount: number;
  total: number;
  status: string;
}

async function getVATData(from: string, to: string) {
  const supabase = await createClient();

  const [salesRes, purchasesRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("subtotal, tax_amount, total, status")
      .eq("type", "sale")
      .gte("created_at", from)
      .lte("created_at", `${to}T23:59:59`),
    supabase
      .from("purchase_orders")
      .select("subtotal, tax_amount, total, status")
      .gte("created_at", from)
      .lte("created_at", `${to}T23:59:59`),
  ]);

  const salesAll = (salesRes.data as Row[] | null) ?? [];
  const purchasesAll = (purchasesRes.data as Row[] | null) ?? [];

  const sales = salesAll.filter((r) => r.status !== "cancelled");
  const purchases = purchasesAll.filter((r) => r.status !== "cancelled");

  const vatCollected = sales.reduce((s, r) => s + (r.tax_amount ?? 0), 0);
  const vatPaid = purchases.reduce((s, r) => s + (r.tax_amount ?? 0), 0);
  const salesTotal = sales.reduce((s, r) => s + (r.total ?? 0), 0);
  const purchasesTotal = purchases.reduce((s, r) => s + (r.total ?? 0), 0);

  return {
    vatCollected,
    vatPaid,
    netVAT: vatCollected - vatPaid,
    salesTotal,
    purchasesTotal,
    salesCount: sales.length,
    purchasesCount: purchases.length,
  };
}

function fmt(n: number) {
  return n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function VATReportPage({ searchParams }: VATReportPageProps) {
  const locale = await getLocale();
  const params = await searchParams;
  const range = resolveRange(params.range);
  const data = await getVATData(range.from, range.to);

  const payable = data.netVAT > 0;

  return (
    <div>
      <div className="mb-6">
        <Link href={`/${locale}/accounting/reports`} className="text-sm text-muted-foreground hover:text-paws-orange transition-colors">
          &larr; Back to Reports
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 mt-2">VAT Report</h1>
        <p className="text-sm text-muted-foreground mt-1">VAT collected and paid for tax filing</p>
      </div>

      <ReportDateFilter basePath={`/${locale}/accounting/reports/vat`} current={range.preset} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-6 border-neutral-200">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-green-600" />
            <span className="text-sm text-muted-foreground">VAT Collected (Output)</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{fmt(data.vatCollected)} <span className="text-sm font-normal text-muted-foreground">EGP</span></p>
          <p className="text-xs text-muted-foreground mt-1">from {data.salesCount} sale{data.salesCount !== 1 ? "s" : ""} · {fmt(data.salesTotal)} EGP gross</p>
        </Card>
        <Card className="p-6 border-neutral-200">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-red-600" />
            <span className="text-sm text-muted-foreground">VAT Paid (Input)</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{fmt(data.vatPaid)} <span className="text-sm font-normal text-muted-foreground">EGP</span></p>
          <p className="text-xs text-muted-foreground mt-1">from {data.purchasesCount} purchase{data.purchasesCount !== 1 ? "s" : ""} · {fmt(data.purchasesTotal)} EGP gross</p>
        </Card>
        <Card className={`p-6 border-2 ${payable ? "border-paws-orange" : "border-green-300"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Receipt className={`w-4 h-4 ${payable ? "text-paws-orange" : "text-green-600"}`} />
            <span className="text-sm text-muted-foreground">{payable ? "Net VAT Payable" : "Net VAT Refund"}</span>
          </div>
          <p className={`text-3xl font-bold ${payable ? "text-paws-orange" : "text-green-600"}`}>
            {fmt(Math.abs(data.netVAT))} <span className="text-sm font-normal text-muted-foreground">EGP</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">Output − Input</p>
        </Card>
      </div>

      <Card className="p-6 border-neutral-200 bg-neutral-50">
        <p className="text-xs text-muted-foreground">
          Cancelled invoices and purchase orders are excluded. Figures come from the <code className="font-mono">tax_amount</code> column on each transaction — tax must be captured at point of sale for this report to be accurate.
        </p>
      </Card>
    </div>
  );
}
