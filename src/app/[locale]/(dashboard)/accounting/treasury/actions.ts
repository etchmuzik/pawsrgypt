"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TreasuryType = "cash" | "bank";

interface TreasuryInput {
  name_en: string;
  name_ar: string;
  type: TreasuryType;
  currency: string;
  branch_id: string | null;
  balance: number;
  is_active: boolean;
}

interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

function validate(input: TreasuryInput): string | null {
  if (!input.name_en.trim()) return "English name is required";
  if (!input.name_ar.trim()) return "Arabic name is required";
  if (input.type !== "cash" && input.type !== "bank") return "Invalid account type";
  if (!input.currency.trim()) return "Currency is required";
  return null;
}

export async function createTreasuryAccount(input: TreasuryInput): Promise<ActionResult> {
  const err = validate(input);
  if (err) return { success: false, error: err };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("treasury_accounts")
    .insert({
      name: input.name_en.trim(),
      name_en: input.name_en.trim(),
      name_ar: input.name_ar.trim(),
      type: input.type,
      currency: input.currency.trim().toUpperCase(),
      branch_id: input.branch_id,
      balance: Number(input.balance) || 0,
      is_active: input.is_active,
    } as never)
    .select("id")
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  revalidatePath("/[locale]/(dashboard)/accounting/treasury", "page");
  return { success: true, id: (data as { id: string } | null)?.id };
}

export async function updateTreasuryAccount(id: string, input: TreasuryInput): Promise<ActionResult> {
  if (!id) return { success: false, error: "Missing id" };
  const err = validate(input);
  if (err) return { success: false, error: err };

  const supabase = await createClient();
  const { error } = await supabase
    .from("treasury_accounts")
    .update({
      name: input.name_en.trim(),
      name_en: input.name_en.trim(),
      name_ar: input.name_ar.trim(),
      type: input.type,
      currency: input.currency.trim().toUpperCase(),
      branch_id: input.branch_id,
      is_active: input.is_active,
    } as never)
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/[locale]/(dashboard)/accounting/treasury", "page");
  return { success: true, id };
}

export async function transferBetweenAccounts(
  fromId: string,
  toId: string,
  amount: number,
  note: string | null,
): Promise<ActionResult> {
  if (!fromId || !toId) return { success: false, error: "Both accounts are required" };
  if (fromId === toId) return { success: false, error: "Cannot transfer to the same account" };
  const amt = Number(amount);
  if (!amt || amt <= 0) return { success: false, error: "Amount must be greater than zero" };

  const supabase = await createClient();
  const { data: accountsData, error: fetchErr } = await supabase
    .from("treasury_accounts")
    .select("id, balance, name_en, currency")
    .in("id", [fromId, toId]);

  if (fetchErr) return { success: false, error: fetchErr.message };
  const accounts = (accountsData as Array<{ id: string; balance: number; name_en: string; currency: string }> | null) ?? [];
  const from = accounts.find((a) => a.id === fromId);
  const to = accounts.find((a) => a.id === toId);
  if (!from || !to) return { success: false, error: "Account not found" };
  if (from.currency !== to.currency) {
    return { success: false, error: "Cannot transfer between accounts with different currencies" };
  }

  const fromNew = Number(from.balance) - amt;
  const toNew = Number(to.balance) + amt;

  const { error: updateFromErr } = await supabase
    .from("treasury_accounts")
    .update({ balance: fromNew } as never)
    .eq("id", fromId);
  if (updateFromErr) return { success: false, error: updateFromErr.message };

  const { error: updateToErr } = await supabase
    .from("treasury_accounts")
    .update({ balance: toNew } as never)
    .eq("id", toId);
  if (updateToErr) {
    await supabase.from("treasury_accounts").update({ balance: from.balance } as never).eq("id", fromId);
    return { success: false, error: updateToErr.message };
  }

  revalidatePath("/[locale]/(dashboard)/accounting/treasury", "page");
  return { success: true };
}
