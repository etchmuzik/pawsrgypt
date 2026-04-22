import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { JournalReverseButton } from "@/components/dashboard/JournalReverseButton";

interface JournalDetailProps {
  params: Promise<{ id: string }>;
}

interface EntryRow {
  id: string;
  entry_date: string;
  reference: string | null;
  description: string | null;
  created_at: string;
  branches: { name: string } | null;
  journal_lines: {
    id: string;
    debit: number;
    credit: number;
    description: string | null;
    account: { code: string; name_en: string; type: string } | null;
  }[];
}

function fmt(n: number): string {
  return n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-EG", { year: "numeric", month: "short", day: "numeric" });
}

export default async function JournalEntryDetailPage({ params }: JournalDetailProps) {
  const { id } = await params;
  const locale = await getLocale();
  const supabase = await createClient();

  const { data } = await supabase
    .from("journal_entries")
    .select(
      "id, entry_date, reference, description, created_at, branches(name), journal_lines(id, debit, credit, description, account:chart_of_accounts(code, name_en, type))",
    )
    .eq("id", id)
    .maybeSingle();

  const entry = data as unknown as EntryRow | null;
  if (!entry) notFound();

  const totalDebit = entry.journal_lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = entry.journal_lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const isReversal = entry.reference?.startsWith("REVERSAL of ") ?? false;
  const reversalRef = entry.reference ? `REVERSAL of ${entry.reference}` : `REVERSAL of ${entry.id.slice(0, 8)}`;
  const { data: reversalData } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("reference", reversalRef)
    .limit(1);
  const alreadyReversed = ((reversalData as Array<{ id: string }> | null) ?? []).length > 0;

  return (
    <div>
      <div className="mb-6">
        <Link href={`/${locale}/accounting/journal`} className="text-sm text-muted-foreground hover:text-paws-orange">
          &larr; Back to Journal
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {entry.reference ?? `Entry ${entry.id.slice(0, 8)}`}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(entry.entry_date)}{entry.branches?.name ? ` · ${entry.branches.name}` : ""}
            </p>
          </div>
          {!isReversal && <JournalReverseButton entryId={entry.id} alreadyReversed={alreadyReversed} />}
          {isReversal && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
              Reversal Entry
            </span>
          )}
        </div>
      </div>

      {entry.description && (
        <Card className="p-4 border-neutral-200 mb-4">
          <p className="text-sm text-neutral-900 whitespace-pre-wrap">{entry.description}</p>
        </Card>
      )}

      <Card className="border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Account</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Memo</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground w-32">Debit</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground w-32">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {entry.journal_lines.map((line) => (
              <tr key={line.id}>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-muted-foreground mr-2">{line.account?.code ?? "—"}</span>
                  <span className="text-neutral-900">{line.account?.name_en ?? "—"}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{line.description ?? "—"}</td>
                <td className="px-4 py-3 text-right font-mono">{Number(line.debit) > 0 ? fmt(Number(line.debit)) : ""}</td>
                <td className="px-4 py-3 text-right font-mono">{Number(line.credit) > 0 ? fmt(Number(line.credit)) : ""}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-neutral-50 border-t-2 border-neutral-200 font-bold">
              <td colSpan={2} className="px-4 py-3 text-right text-neutral-900">Totals</td>
              <td className="px-4 py-3 text-right font-mono">{fmt(totalDebit)}</td>
              <td className="px-4 py-3 text-right font-mono">{fmt(totalCredit)}</td>
            </tr>
            <tr>
              <td colSpan={4} className="px-4 py-2 text-right text-xs">
                {balanced ? (
                  <span className="text-green-700">Balanced</span>
                ) : (
                  <span className="text-red-600">Out of balance by {fmt(Math.abs(totalDebit - totalCredit))}</span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  );
}
