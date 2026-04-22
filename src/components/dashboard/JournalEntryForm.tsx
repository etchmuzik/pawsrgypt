"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { createJournalEntry } from "@/app/[locale]/(dashboard)/accounting/journal/actions";

interface AccountOption {
  id: string;
  code: string;
  name_en: string;
  type: string;
}

interface BranchOption {
  id: string;
  name: string;
}

interface LineState {
  key: string;
  account_id: string;
  debit: string;
  credit: string;
  description: string;
}

interface JournalEntryFormProps {
  accounts: AccountOption[];
  branches: BranchOption[];
}

function genKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptyLine(): LineState {
  return { key: genKey(), account_id: "", debit: "", credit: "", description: "" };
}

function fmt(n: number): string {
  return n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function JournalEntryForm({ accounts, branches }: JournalEntryFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("accounting");
  const tCommon = useTranslations("common");
  const L = {
    reference: locale === "ar" ? "المرجع (اختياري)" : "Reference (optional)",
    branch: locale === "ar" ? "الفرع (اختياري)" : "Branch (optional)",
    none: locale === "ar" ? "— لا شيء —" : "— None —",
    descriptionOpt: locale === "ar" ? "الوصف (اختياري)" : "Description (optional)",
    account: locale === "ar" ? "الحساب" : "Account",
    debit: locale === "ar" ? "مدين" : "Debit",
    credit: locale === "ar" ? "دائن" : "Credit",
    memo: locale === "ar" ? "بيان" : "Memo",
    select: locale === "ar" ? "— اختار —" : "— Select —",
    totals: locale === "ar" ? "الإجمالي" : "Totals",
    balanced: locale === "ar" ? "متوازن" : "Balanced",
    diff: locale === "ar" ? "فرق" : "Difference",
    addLine: locale === "ar" ? "ضيف سطر" : "Add Line",
    remove: locale === "ar" ? "شيل السطر" : "Remove line",
    createEntry: locale === "ar" ? "إنشاء القيد" : "Create Entry",
    failed: locale === "ar" ? "فشل الحفظ" : "Failed to save",
  };
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [entryDate, setEntryDate] = useState(today);
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [branchId, setBranchId] = useState("");
  const [lines, setLines] = useState<LineState[]>([emptyLine(), emptyLine()]);

  function updateLine(key: string, patch: Partial<LineState>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length <= 2 ? prev : prev.filter((l) => l.key !== key)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      entry_date: entryDate,
      reference: reference || null,
      description: description || null,
      branch_id: branchId || null,
      lines: lines.map((l) => ({
        account_id: l.account_id,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        description: l.description || null,
      })),
    };
    startTransition(async () => {
      const res = await createJournalEntry(payload);
      if (!res.success) {
        setError(res.error ?? L.failed);
        return;
      }
      router.push(`/${locale}/accounting/journal`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="entry_date">{tCommon("date")}</Label>
          <Input id="entry_date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="reference">{L.reference}</Label>
          <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="JE-001" />
        </div>
        <div>
          <Label htmlFor="branch">{L.branch}</Label>
          <select
            id="branch"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">{L.none}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">{L.descriptionOpt}</Label>
        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground">{L.account}</th>
              <th className="text-right px-3 py-2 font-semibold text-muted-foreground w-32">{L.debit}</th>
              <th className="text-right px-3 py-2 font-semibold text-muted-foreground w-32">{L.credit}</th>
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground">{L.memo}</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {lines.map((line) => (
              <tr key={line.key}>
                <td className="px-3 py-2">
                  <select
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                    value={line.account_id}
                    onChange={(e) => updateLine(line.key, { account_id: e.target.value })}
                    required
                  >
                    <option value="">{L.select}</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} · {a.name_en}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="text-right font-mono"
                    value={line.debit}
                    onChange={(e) => updateLine(line.key, { debit: e.target.value, credit: e.target.value ? "" : line.credit })}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="text-right font-mono"
                    value={line.credit}
                    onChange={(e) => updateLine(line.key, { credit: e.target.value, debit: e.target.value ? "" : line.debit })}
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    value={line.description}
                    onChange={(e) => updateLine(line.key, { description: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    disabled={lines.length <= 2}
                    className="text-red-500 hover:text-red-700 disabled:opacity-30"
                    aria-label={L.remove}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-neutral-50 border-t-2 border-neutral-200 font-semibold">
              <td className="px-3 py-2 text-right text-muted-foreground">{L.totals}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(totalDebit)}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(totalCredit)}</td>
              <td colSpan={2} className="px-3 py-2">
                {balanced ? (
                  <span className="text-green-700 text-xs">{L.balanced}</span>
                ) : (
                  <span className="text-red-600 text-xs">
                    {L.diff}: {fmt(Math.abs(totalDebit - totalCredit))}
                  </span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1.5">
        <Plus className="w-4 h-4" /> {L.addLine}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={pending || !balanced}
          className="bg-paws-orange hover:bg-paws-orange/90 text-white"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {L.createEntry}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
