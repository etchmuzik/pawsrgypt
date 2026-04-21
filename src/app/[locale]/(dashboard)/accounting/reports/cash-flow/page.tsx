import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ArrowDownUp } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { resolveRange } from "@/lib/report-dates";
import { ReportDateFilter } from "@/components/dashboard/ReportDateFilter";

interface CashFlowPageProps {
  searchParams: Promise<{ range?: string }>;
}

async function getCashFlow(from: string, to: string) {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select("amount, method, created_at")
    .gte("created_at", from)
    .lte("created_at", `${to}T23:59:59`)
    .order("created_at", { ascending: false });

  type Payment = { amount: number; method: string; created_at: string };
  const all = (payments as Payment[] | null) ?? [];

  const byMethod = { cash: 0, card: 0, transfer: 0, check: 0 };
  let total = 0;
  for (const p of all) {
    const amount = p.amount ?? 0;
    total += amount;
    if (p.method === "cash") byMethod.cash += amount;
    else if (p.method === "card") byMethod.card += amount;
    else if (p.method === "transfer") byMethod.transfer += amount;
    else if (p.method === "check") byMethod.check += amount;
  }

  return { ...byMethod, total, count: all.length };
}

function fmt(n: number) {
  return n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function CashFlowPage({ searchParams }: CashFlowPageProps) {
  const locale = await getLocale();
  const params = await searchParams;
  const range = resolveRange(params.range);
  const data = await getCashFlow(range.from, range.to);

  const methods = [
    { label: "Cash", value: data.cash, color: "text-green-600", bg: "bg-green-50" },
    { label: "Card", value: data.card, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Bank Transfer", value: data.transfer, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Check", value: data.check, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div>
      <div className="mb-6">
        <Link href={`/${locale}/accounting/reports`} className="text-sm text-muted-foreground hover:text-paws-orange transition-colors">
          &larr; Back to Reports
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 mt-2">Cash Flow</h1>
        <p className="text-sm text-muted-foreground mt-1">Cash inflows by payment method</p>
      </div>

      <ReportDateFilter basePath={`/${locale}/accounting/reports/cash-flow`} current={range.preset} />

      <Card className="p-5 border-neutral-200 mb-6">
        <span className="text-sm text-muted-foreground">Total Cash Inflow</span>
        <p className="text-3xl font-bold text-neutral-900 mt-1">{fmt(data.total)} <span className="text-base font-normal text-muted-foreground">EGP</span></p>
        <p className="text-xs text-muted-foreground mt-1">{data.count} payment{data.count !== 1 ? "s" : ""} recorded</p>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {methods.map((m) => {
          const pct = data.total > 0 ? (m.value / data.total) * 100 : 0;
          return (
            <Card key={m.label} className="p-5 border-neutral-200">
              <span className="text-sm text-muted-foreground">{m.label}</span>
              <p className={`text-xl font-bold mt-2 ${m.color}`}>{fmt(m.value)}</p>
              <div className="h-1 bg-neutral-100 rounded-full mt-3 overflow-hidden">
                <div className={`h-full ${m.bg.replace("bg-", "bg-").replace("-50", "-400")}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{pct.toFixed(1)}% of total</p>
            </Card>
          );
        })}
      </div>

      {data.count === 0 && (
        <Card className="p-12 border-neutral-200 text-center">
          <ArrowDownUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-900 mb-1">No payments in this period</h3>
          <p className="text-sm text-muted-foreground">Try widening the date range.</p>
        </Card>
      )}
    </div>
  );
}
