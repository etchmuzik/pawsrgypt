import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";

type JournalEntry = {
  id: string;
  reference: string;
  description: string | null;
  entry_date: string;
  created_at: string;
  journal_lines: JournalLine[];
};

type JournalLine = {
  id: string;
  debit: number;
  credit: number;
  account: { code: string; name_en: string } | null;
};

async function getJournalEntries(): Promise<JournalEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select(
      `
      id,
      reference,
      description,
      entry_date,
      created_at,
      journal_lines (
        id,
        debit,
        credit,
        account:chart_of_accounts ( code, name_en )
      )
    `
    )
    .order("entry_date", { ascending: false })
    .limit(50);

  if (error) {
    return [];
  }

  return (data as unknown as JournalEntry[]) ?? [];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function JournalEntriesPage() {
  const locale = await getLocale();
  const entries = await getJournalEntries();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-paws-brown-dark">Journal Entries</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and create double-entry journal entries
          </p>
        </div>
        <Link href={`/${locale}/accounting/journal/new`}>
          <Button className="bg-paws-orange hover:bg-paws-orange/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </Link>
      </div>

      {entries.length === 0 ? (
        <Card className="p-12 border-paws-sand text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-paws-brown-dark mb-2">No journal entries</h3>
          <p className="text-muted-foreground mb-4">
            Create your first journal entry to start recording transactions.
          </p>
          <Link href={`/${locale}/accounting/journal/new`}>
            <Button className="bg-paws-orange hover:bg-paws-orange/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="border-paws-sand overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-paws-sand bg-paws-cream/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Description
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Debit
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Credit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paws-sand/50">
                {entries.map((entry) => {
                  const totalDebit = entry.journal_lines.reduce(
                    (sum, line) => sum + (line.debit ?? 0),
                    0
                  );
                  const totalCredit = entry.journal_lines.reduce(
                    (sum, line) => sum + (line.credit ?? 0),
                    0
                  );
                  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-paws-cream/20 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3 text-sm text-paws-brown-dark whitespace-nowrap">
                        {formatDate(entry.entry_date)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-mono text-paws-brown-dark">
                          {entry.reference}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground max-w-xs truncate">
                        {entry.description ?? "-"}
                      </td>
                      <td className="px-5 py-3 text-sm text-right font-mono text-paws-brown-dark">
                        {formatAmount(totalDebit)}
                      </td>
                      <td className="px-5 py-3 text-sm text-right font-mono text-paws-brown-dark">
                        <span className="flex items-center justify-end gap-2">
                          {formatAmount(totalCredit)}
                          {!isBalanced && (
                            <span className="w-2 h-2 rounded-full bg-red-500" title="Unbalanced" />
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="mt-4">
        <Link
          href={`/${locale}/accounting`}
          className="text-sm text-muted-foreground hover:text-paws-orange transition-colors"
        >
          &larr; Back to Accounting
        </Link>
      </div>
    </div>
  );
}
