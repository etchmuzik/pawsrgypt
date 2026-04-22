"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

interface AccountInput {
  code: string;
  name_en: string;
  name_ar: string;
  type: AccountType;
  parent_id: string | null;
  is_active: boolean;
}

const ACCOUNT_TYPES: readonly AccountType[] = ["asset", "liability", "equity", "income", "expense"];

function validate(input: AccountInput): string | null {
  if (!input.code.trim()) return "Code is required";
  if (!/^[0-9A-Za-z._-]+$/.test(input.code)) return "Code may only contain letters, digits, . _ -";
  if (!input.name_en.trim()) return "English name is required";
  if (!input.name_ar.trim()) return "Arabic name is required";
  if (!ACCOUNT_TYPES.includes(input.type)) return "Invalid account type";
  return null;
}

export async function createAccount(input: AccountInput): Promise<ActionResult> {
  const err = validate(input);
  if (err) return { success: false, error: err };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chart_of_accounts")
    .insert({
      code: input.code.trim(),
      name_en: input.name_en.trim(),
      name_ar: input.name_ar.trim(),
      type: input.type,
      parent_id: input.parent_id,
      is_active: input.is_active,
    } as never)
    .select("id")
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  revalidatePath("/[locale]/(dashboard)/accounting/accounts", "page");
  return { success: true, id: (data as { id: string } | null)?.id };
}

export async function updateAccount(id: string, input: AccountInput): Promise<ActionResult> {
  if (!id) return { success: false, error: "Missing id" };
  const err = validate(input);
  if (err) return { success: false, error: err };

  if (input.parent_id === id) {
    return { success: false, error: "Account cannot be its own parent" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("chart_of_accounts")
    .update({
      code: input.code.trim(),
      name_en: input.name_en.trim(),
      name_ar: input.name_ar.trim(),
      type: input.type,
      parent_id: input.parent_id,
      is_active: input.is_active,
    } as never)
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/[locale]/(dashboard)/accounting/accounts", "page");
  return { success: true, id };
}
