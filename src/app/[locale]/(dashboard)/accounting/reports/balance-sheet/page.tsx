import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Scale } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";

interface BalanceSheetPageProps {
  searchParams: Promise<{ asOf?: string }>;
}

interface JournalLine {
  debit: number;
  credit: number;
  account: { type: string; name_en: string; code: string } | null;
}

interface AccountBalance {
  code: string;
  name: string;
  total: number;
}

function fmt(n: number): string {
  return n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getBalanceSheet(asOf: string) {
  const supabase = await createClient();

  const { data: lines } = await supabase
    .from("journal_lines")
    .select("debit, credit, account:chart_of_accounts!inner(type, name_en, code), entry:journal_entries!inner(entry_date)")
    .lte("entry.entry_date", asOf);

  const all = (lines as (JournalLine & { entry: { entry_date: string } | null })[] | null) ?? [];

  const assets = new Map<string, AccountBalance>();
  const liabilities = new Map<string, AccountBalance>();
  const equity = new Map<string, AccountBalance>();
  let income = 0;
  let expense = 0;

  for (const line of all) {
    const acc = line.account;
    if (!acc) continue;
    const debit = Number(line.debit) || 0;
    const credit = Number(line.credit) || 0;

    if (acc.type === "asset") {
      const delta = debit - credit;
      const existing = assets.get(acc.code);
      if (existing) existing.total += delta;
      else assets.set(acc.code, { code: acc.code, name: acc.name_en, total: delta });
    } else if (acc.type === "liability") {
      const delta = credit - debit;
      const existing = liabilities.get(acc.code);
      if (existing) existing.total += delta;
      else liabilities.set(acc.code, { code: acc.code, name: acc.name_en, total: delta });
    } else if (acc.type === "equity") {
      const delta = credit - debit;
      const existing = equity.get(acc.code);
      if (existing) existing.total += delta;
      else equity.set(acc.code, { code: acc.code, name: acc.name_en, total: delta });
    } else if (acc.type === "income") {
      income += credit - debit;
    } else if (acc.type === "expense") {
      expense += debit - credit;
    }
  }

  const assetRows = Array.from(assets.values()).sort((a, b) => b.total - a.total);
  const liabilityRows = Array.from(liabilities.values()).sort((a, b) => b.total - a.total);
  const equityRows = Array.from(equity.values()).sort((a, b) => b.total - a.total);

  const totalAssets = assetRows.reduce((s, r) => s + r.total, 0);
  const totalLiabilities = liabilityRows.reduce((s, r) => s + r.total, 0);
  const totalEquityRaw = equityRows.reduce((s, r) => s + r.total, 0);
  const retainedEarnings = income - expense;
  const totalEquity = totalEquityRaw + retainedEarnings;

  return {
    assetRows,
    liabilityRows,
    equityRows,
    retainedEarnings,
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
  };
}

export default async function BalanceSheetPage({ searchParams }: BalanceSheetPageProps) {
  const locale = await getLocale();
  const params = await searchParams;
  const asOf = params.asOf ?? todayIso();
  const data = await getBalanceSheet(asOf);

  const balanced = Math.abs(data.totalAssets - data.totalLiabilitiesAndEquity) < 0.01;
  const empty =
    data.assetRows.length === 0 &&
    data.liabilityRows.length === 0 &&
    data.equityRows.length === 0 &&
    data.retainedEarnings === 0;

  return (
    <div>
      <div className="mb-6">
        <Link href={`/${locale}/accounting/reports`} className="text-sm text-muted-foreground hover:text-paws-orange transition-colors">
          &larr; Back to Reports
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 mt-2">Balance Sheet</h1>
        <p className="text-sm text-muted-foreground mt-1">Assets, liabilities, and equity as of a point in time</p>
      </div>

      <form className="mb-6 flex items-end gap-3" action={`/${locale}/accounting/reports/balance-sheet`}>
        <div>
          <label htmlFor="asOf" className="block text-xs font-medium text-muted-foreground mb-1">As of date</label>
          <input
            id="asOf"
            name="asOf"
            type="date"
            defaultValue={asOf}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          />
        </div>
        <button type="submit" className="h-9 px-4 rounded-md bg-paws-orange text-white text-sm font-medium hover:bg-paws-orange/90">
          Update
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">Total Assets</span>
          <p className="text-2xl font-bold text-blue-700 mt-2">{fmt(data.totalAssets)} <span className="text-sm font-normal text-muted-foreground">EGP</span></p>
        </Card>
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">Total Liabilities</span>
          <p className="text-2xl font-bold text-red-700 mt-2">{fmt(data.totalLiabilities)} <span className="text-sm font-normal text-muted-foreground">EGP</span></p>
        </Card>
        <Card className={`p-5 border-2 ${balanced ? "border-green-300" : "border-amber-300"}`}>
          <span className="text-sm text-muted-foreground">Total Equity</span>
          <p className="text-2xl font-bold text-purple-700 mt-2">{fmt(data.totalEquity)} <span className="text-sm font-normal text-muted-foreground">EGP</span></p>
          <p className="text-xs mt-1">
            {balanced ? <span className="text-green-700">Balance sheet balances</span> : <span className="text-amber-700">Out of balance by {fmt(Math.abs(data.totalAssets - data.totalLiabilitiesAndEquity))}</span>}
          </p>
        </Card>
      </div>

      {empty ? (
        <Card className="p-12 border-neutral-200 text-center">
          <Scale className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-900 mb-1">No journal activity as of {asOf}</h3>
          <p className="text-sm text-muted-foreground">Create journal entries to see a balance sheet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="border-neutral-200 overflow-hidden">
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
              <h3 className="font-semibold text-blue-800">Assets</h3>
            </div>
            {data.assetRows.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">No assets.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-neutral-100">
                  {data.assetRows.map((r) => (
                    <tr key={r.code}>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground w-20">{r.code}</td>
                      <td className="px-4 py-3 text-neutral-900">{r.name}</td>
                      <td className="px-4 py-3 text-right font-mono text-blue-700">{fmt(r.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-bold">
                    <td colSpan={2} className="px-4 py-3 text-blue-800">Total Assets</td>
                    <td className="px-4 py-3 text-right font-mono text-blue-800">{fmt(data.totalAssets)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </Card>

          <Card className="border-neutral-200 overflow-hidden">
            <div className="px-4 py-3 bg-red-50 border-b border-red-100">
              <h3 className="font-semibold text-red-800">Liabilities &amp; Equity</h3>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-neutral-100">
                {data.liabilityRows.map((r) => (
                  <tr key={r.code}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground w-20">{r.code}</td>
                    <td className="px-4 py-3 text-neutral-900">{r.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-700">{fmt(r.total)}</td>
                  </tr>
                ))}
                {data.liabilityRows.length > 0 && (
                  <tr className="bg-red-50 font-semibold">
                    <td colSpan={2} className="px-4 py-2 text-red-800">Total Liabilities</td>
                    <td className="px-4 py-2 text-right font-mono text-red-800">{fmt(data.totalLiabilities)}</td>
                  </tr>
                )}
                {data.equityRows.map((r) => (
                  <tr key={r.code}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground w-20">{r.code}</td>
                    <td className="px-4 py-3 text-neutral-900">{r.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-purple-700">{fmt(r.total)}</td>
                  </tr>
                ))}
                {data.retainedEarnings !== 0 && (
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground w-20">—</td>
                    <td className="px-4 py-3 text-neutral-900">Retained Earnings</td>
                    <td className="px-4 py-3 text-right font-mono text-purple-700">{fmt(data.retainedEarnings)}</td>
                  </tr>
                )}
                <tr className="bg-purple-50 font-semibold">
                  <td colSpan={2} className="px-4 py-2 text-purple-800">Total Equity</td>
                  <td className="px-4 py-2 text-right font-mono text-purple-800">{fmt(data.totalEquity)}</td>
                </tr>
                <tr className="bg-neutral-100 font-bold border-t-2 border-neutral-300">
                  <td colSpan={2} className="px-4 py-3 text-neutral-900">Total Liabilities &amp; Equity</td>
                  <td className="px-4 py-3 text-right font-mono text-neutral-900">{fmt(data.totalLiabilitiesAndEquity)}</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}
