import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { resolveRange } from "@/lib/report-dates";
import { ReportDateFilter } from "@/components/dashboard/ReportDateFilter";

interface ProfitLossPageProps {
  searchParams: Promise<{ range?: string }>;
}

interface JournalLine {
  debit: number;
  credit: number;
  account: { type: string; name_en: string; code: string } | null;
  entry: { entry_date: string } | null;
}

interface AccountBreakdown {
  code: string;
  name: string;
  total: number;
}

async function getPnLData(from: string, to: string) {
  const supabase = await createClient();

  const { data: lines } = await supabase
    .from("journal_lines")
    .select("debit, credit, account:chart_of_accounts!inner(type, name_en, code), entry:journal_entries!inner(entry_date)")
    .in("account.type", ["income", "expense"])
    .gte("entry.entry_date", from)
    .lte("entry.entry_date", to);

  const all = (lines as JournalLine[] | null) ?? [];

  const incomeByAccount = new Map<string, AccountBreakdown>();
  const expenseByAccount = new Map<string, AccountBreakdown>();
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const line of all) {
    const acc = line.account;
    if (!acc) continue;
    if (acc.type === "income") {
      const contribution = (line.credit ?? 0) - (line.debit ?? 0);
      totalIncome += contribution;
      const existing = incomeByAccount.get(acc.code);
      if (existing) existing.total += contribution;
      else incomeByAccount.set(acc.code, { code: acc.code, name: acc.name_en, total: contribution });
    } else if (acc.type === "expense") {
      const contribution = (line.debit ?? 0) - (line.credit ?? 0);
      totalExpenses += contribution;
      const existing = expenseByAccount.get(acc.code);
      if (existing) existing.total += contribution;
      else expenseByAccount.set(acc.code, { code: acc.code, name: acc.name_en, total: contribution });
    }
  }

  const incomeRows = Array.from(incomeByAccount.values()).sort((a, b) => b.total - a.total);
  const expenseRows = Array.from(expenseByAccount.values()).sort((a, b) => b.total - a.total);

  return { totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses, incomeRows, expenseRows };
}

function fmt(n: number) {
  return n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function ProfitLossPage({ searchParams }: ProfitLossPageProps) {
  const locale = await getLocale();
  const params = await searchParams;
  const range = resolveRange(params.range);
  const data = await getPnLData(range.from, range.to);

  const empty = data.totalIncome === 0 && data.totalExpenses === 0;

  return (
    <div>
      <div className="mb-6">
        <Link href={`/${locale}/accounting/reports`} className="text-sm text-muted-foreground hover:text-paws-orange transition-colors">
          &larr; Back to Reports
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 mt-2">Profit & Loss</h1>
        <p className="text-sm text-muted-foreground mt-1">Revenue, expenses, and net income</p>
      </div>

      <ReportDateFilter basePath={`/${locale}/accounting/reports/profit-loss`} current={range.preset} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm text-muted-foreground">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{fmt(data.totalIncome)} EGP</p>
        </Card>
        <Card className="p-5 border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span className="text-sm text-muted-foreground">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{fmt(data.totalExpenses)} EGP</p>
        </Card>
        <Card className={`p-5 border-2 ${data.netProfit >= 0 ? "border-green-300" : "border-red-300"}`}>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className={`w-5 h-5 ${data.netProfit >= 0 ? "text-green-600" : "text-red-600"}`} />
            <span className="text-sm text-muted-foreground">Net Profit</span>
          </div>
          <p className={`text-2xl font-bold ${data.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {fmt(data.netProfit)} EGP
          </p>
        </Card>
      </div>

      {empty ? (
        <Card className="p-12 border-neutral-200 text-center">
          <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-900 mb-1">No transactions in this period</h3>
          <p className="text-sm text-muted-foreground">Try widening the date range or create journal entries.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="border-neutral-200 overflow-hidden">
            <div className="px-4 py-3 bg-green-50 border-b border-green-100">
              <h3 className="font-semibold text-green-800">Revenue by Account</h3>
            </div>
            {data.incomeRows.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">No revenue recorded.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-neutral-100">
                  {data.incomeRows.map((r) => (
                    <tr key={r.code}>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground w-20">{r.code}</td>
                      <td className="px-4 py-3 text-neutral-900">{r.name}</td>
                      <td className="px-4 py-3 text-right font-mono text-green-700">{fmt(r.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-green-50 font-bold">
                    <td colSpan={2} className="px-4 py-3 text-green-800">Total Revenue</td>
                    <td className="px-4 py-3 text-right font-mono text-green-800">{fmt(data.totalIncome)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </Card>

          <Card className="border-neutral-200 overflow-hidden">
            <div className="px-4 py-3 bg-red-50 border-b border-red-100">
              <h3 className="font-semibold text-red-800">Expenses by Account</h3>
            </div>
            {data.expenseRows.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">No expenses recorded.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-neutral-100">
                  {data.expenseRows.map((r) => (
                    <tr key={r.code}>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground w-20">{r.code}</td>
                      <td className="px-4 py-3 text-neutral-900">{r.name}</td>
                      <td className="px-4 py-3 text-right font-mono text-red-700">{fmt(r.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-red-50 font-bold">
                    <td colSpan={2} className="px-4 py-3 text-red-800">Total Expenses</td>
                    <td className="px-4 py-3 text-right font-mono text-red-800">{fmt(data.totalExpenses)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
