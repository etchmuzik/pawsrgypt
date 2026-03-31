import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Scale, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";

async function getBalanceSheet() {
  const supabase = await createClient();

  const { data: lines } = await supabase
    .from("journal_lines")
    .select("debit, credit, account:chart_of_accounts!inner(type, name_en, code)");

  type Line = { debit: number; credit: number; account: { type: string; name_en: string; code: string } | null };
  const all = (lines as Line[] | null) ?? [];

  const totals: Record<string, number> = { asset: 0, liability: 0, equity: 0 };
  for (const line of all) {
    const type = line.account?.type ?? "";
    if (type === "asset") totals.asset += (line.debit ?? 0) - (line.credit ?? 0);
    if (type === "liability") totals.liability += (line.credit ?? 0) - (line.debit ?? 0);
    if (type === "equity") totals.equity += (line.credit ?? 0) - (line.debit ?? 0);
  }

  return totals;
}

function fmt(n: number) {
  return n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function BalanceSheetPage() {
  const locale = await getLocale();
  const data = await getBalanceSheet();

  const sections = [
    { label: "Total Assets", value: data.asset, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Liabilities", value: data.liability, color: "text-red-600", bg: "bg-red-50" },
    { label: "Total Equity", value: data.equity, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div>
      <div className="mb-6">
        <Link href={`/${locale}/accounting/reports`} className="text-sm text-muted-foreground hover:text-paws-orange transition-colors">
          &larr; Back to Reports
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 mt-2">Balance Sheet</h1>
        <p className="text-sm text-muted-foreground mt-1">Assets, liabilities, and equity at a point in time</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {sections.map((s) => (
          <Card key={s.label} className="p-5 border-neutral-200">
            <span className="text-sm text-muted-foreground">{s.label}</span>
            <p className={`text-2xl font-bold mt-2 ${s.color}`}>{fmt(s.value)} EGP</p>
          </Card>
        ))}
      </div>

      {data.asset === 0 && data.liability === 0 && data.equity === 0 && (
        <Card className="p-12 border-neutral-200 text-center">
          <Scale className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-900 mb-1">No data yet</h3>
          <p className="text-sm text-muted-foreground">Create journal entries to see your balance sheet.</p>
        </Card>
      )}
    </div>
  );
}
