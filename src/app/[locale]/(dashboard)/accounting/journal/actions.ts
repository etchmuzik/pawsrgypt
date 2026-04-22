"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface JournalLineInput {
  account_id: string;
  debit: number;
  credit: number;
  description: string | null;
}

interface JournalEntryInput {
  entry_date: string;
  reference: string | null;
  description: string | null;
  branch_id: string | null;
  lines: JournalLineInput[];
}

interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

export async function createJournalEntry(input: JournalEntryInput): Promise<ActionResult> {
  if (!input.entry_date) return { success: false, error: "Entry date is required" };
  if (input.lines.length < 2) return { success: false, error: "At least two lines are required" };

  for (const line of input.lines) {
    if (!line.account_id) return { success: false, error: "Every line needs an account" };
    const debit = Number(line.debit) || 0;
    const credit = Number(line.credit) || 0;
    if (debit < 0 || credit < 0) return { success: false, error: "Amounts cannot be negative" };
    if (debit === 0 && credit === 0) return { success: false, error: "Each line needs a debit or credit amount" };
    if (debit > 0 && credit > 0) return { success: false, error: "A line cannot have both debit and credit" };
  }

  const totalDebit = input.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = input.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  if (Math.abs(totalDebit - totalCredit) >= 0.01) {
    return { success: false, error: `Debits (${totalDebit.toFixed(2)}) and credits (${totalCredit.toFixed(2)}) must match` };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: entryData, error: entryErr } = await supabase
    .from("journal_entries")
    .insert({
      entry_date: input.entry_date,
      reference: input.reference?.trim() || null,
      description: input.description?.trim() || null,
      branch_id: input.branch_id,
      created_by: user.id,
    } as never)
    .select("id")
    .maybeSingle();

  if (entryErr || !entryData) {
    return { success: false, error: entryErr?.message ?? "Failed to create entry" };
  }

  const entryId = (entryData as { id: string }).id;

  const lineRows = input.lines.map((l) => ({
    entry_id: entryId,
    account_id: l.account_id,
    debit: Number(l.debit) || 0,
    credit: Number(l.credit) || 0,
    description: l.description?.trim() || null,
  }));

  const { error: linesErr } = await supabase.from("journal_lines").insert(lineRows as never);

  if (linesErr) {
    await supabase.from("journal_entries").delete().eq("id", entryId);
    return { success: false, error: linesErr.message };
  }

  revalidatePath("/[locale]/(dashboard)/accounting/journal", "page");
  return { success: true, id: entryId };
}

interface SourceLine {
  account_id: string;
  debit: number;
  credit: number;
  description: string | null;
}

interface SourceEntry {
  id: string;
  entry_date: string;
  reference: string | null;
  description: string | null;
  branch_id: string | null;
  journal_lines: SourceLine[];
}

export async function reverseJournalEntry(entryId: string): Promise<ActionResult> {
  if (!entryId) return { success: false, error: "Missing entry id" };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: srcData, error: srcErr } = await supabase
    .from("journal_entries")
    .select("id, entry_date, reference, description, branch_id, journal_lines(account_id, debit, credit, description)")
    .eq("id", entryId)
    .maybeSingle();

  if (srcErr || !srcData) {
    return { success: false, error: srcErr?.message ?? "Entry not found" };
  }

  const src = srcData as unknown as SourceEntry;
  if (!src.journal_lines?.length) {
    return { success: false, error: "Source entry has no lines to reverse" };
  }

  const reverseRef = src.reference ? `REVERSAL of ${src.reference}` : `REVERSAL of ${src.id.slice(0, 8)}`;

  const existing = await supabase
    .from("journal_entries")
    .select("id")
    .eq("reference", reverseRef)
    .limit(1);
  if ((existing.data as Array<{ id: string }> | null)?.length) {
    return { success: false, error: "This entry has already been reversed" };
  }

  const today = new Date().toISOString().slice(0, 10);
  const reverseDate = today < src.entry_date ? src.entry_date : today;

  const { data: newEntry, error: insertErr } = await supabase
    .from("journal_entries")
    .insert({
      entry_date: reverseDate,
      reference: reverseRef,
      description: src.description
        ? `Reversal of entry ${src.id.slice(0, 8)} — ${src.description}`
        : `Reversal of entry ${src.id.slice(0, 8)}`,
      branch_id: src.branch_id,
      created_by: user.id,
    } as never)
    .select("id")
    .maybeSingle();

  if (insertErr || !newEntry) {
    return { success: false, error: insertErr?.message ?? "Failed to create reversal" };
  }

  const newId = (newEntry as { id: string }).id;
  const reversedLines = src.journal_lines.map((l) => ({
    entry_id: newId,
    account_id: l.account_id,
    debit: Number(l.credit) || 0,
    credit: Number(l.debit) || 0,
    description: l.description ? `Reversal: ${l.description}` : "Reversal",
  }));

  const { error: linesErr } = await supabase.from("journal_lines").insert(reversedLines as never);
  if (linesErr) {
    await supabase.from("journal_entries").delete().eq("id", newId);
    return { success: false, error: linesErr.message };
  }

  revalidatePath("/[locale]/(dashboard)/accounting/journal", "page");
  return { success: true, id: newId };
}
