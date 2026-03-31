import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";

async function getPnLData() {
  const supabase = await createClient();

  const { data: income } = await supabase
    .from("journal_lines")
    .select("credit, account:chart_of_accounts!inner(type, name_en)")
    .eq("account.type", "income");

  const { data: expenses } = await supabase
    .from("journal_lines")
    .select("debit, account:chart_of_accounts!inner(type, name_en)")
    .eq("account.type", "expense");

  type JournalLine = { credit?: number; debit?: number; account: { type: string; name_en: string } | null };

  const totalIncome = ((income as JournalLine[] | null) ?? []).reduce((s, l) => s + (l.credit ?? 0), 0);
  const totalExpenses = ((expenses as JournalLine[] | null) ?? []).reduce((s, l) => s + (l.debit ?? 0), 0);

  return { totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses };
}

function fmt(n: number) {
  return n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function ProfitLossPage() {
  const locale = await getLocale();
  const data = await getPnLData();

  const rows = [
    { label: "Total Revenue", value: data.totalIncome, color: "text-green-600", icon: TrendingUp },
    { label: "Total Expenses", value: data.totalExpenses, color: "text-red-600", icon: TrendingDown },
  ];

  return (
    <div>
      <div className="mb-6">
        <Link href={`/${locale}/accounting/reports`} className="text-sm text-muted-foreground hover:text-paws-orange transition-colors">
          &larr; Back to Reports
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 mt-2">Profit & Loss</h1>
        <p className="text-sm text-muted-foreground mt-1">Revenue, expenses, and net income</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {rows.map((r) => (
          <Card key={r.label} className="p-5 border-neutral-200">
            <div className="flex items-center gap-3 mb-2">
              <r.icon className={`w-5 h-5 ${r.color}`} />
              <span className="text-sm text-muted-foreground">{r.label}</span>
            </div>
            <p className={`text-2xl font-bold ${r.color}`}>{fmt(r.value)} EGP</p>
          </Card>
        ))}
        <Card className="p-5 border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className={`w-5 h-5 ${data.netProfit >= 0 ? "text-green-600" : "text-red-600"}`} />
            <span className="text-sm text-muted-foreground">Net Profit</span>
          </div>
          <p className={`text-2xl font-bold ${data.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {fmt(data.netProfit)} EGP
          </p>
        </Card>
      </div>

      {data.totalIncome === 0 && data.totalExpenses === 0 && (
        <Card className="p-12 border-neutral-200 text-center">
          <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-900 mb-1">No transactions yet</h3>
          <p className="text-sm text-muted-foreground">Create journal entries to see your profit & loss report.</p>
        </Card>
      )}
    </div>
  );
}
