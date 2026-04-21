"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface ActionResult {
  ok: boolean;
  error?: string;
}

const DEFAULT_SETTINGS: Array<{ key: string; value: string }> = [
  { key: "company_name", value: "PAWS Egypt" },
  { key: "default_currency", value: "EGP" },
  { key: "default_language", value: "en" },
  { key: "tax_rate", value: "14" },
  { key: "tax_inclusive", value: "false" },
  { key: "invoice_prefix", value: "INV-" },
  { key: "invoice_next_number", value: "1" },
  { key: "low_stock_threshold", value: "5" },
  { key: "pos_receipt_footer", value: "Thank you for shopping with PAWS Egypt!" },
  { key: "sms_notifications", value: "false" },
  { key: "email_notifications", value: "true" },
];

export async function initializeDefaultSettings(): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("system_settings")
    .select("key")
    .is("branch_id", null);

  const existingKeys = new Set(((existing as { key: string }[] | null) ?? []).map((s) => s.key));
  const toInsert = DEFAULT_SETTINGS.filter((s) => !existingKeys.has(s.key)).map((s) => ({
    key: s.key,
    value: s.value,
    branch_id: null,
  }));

  if (toInsert.length === 0) {
    return { ok: true };
  }

  const { error } = await supabase.from("system_settings").insert(toInsert as never);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/[locale]/(dashboard)/settings/system", "page");
  return { ok: true };
}

export async function updateSetting(id: string, value: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing setting id." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("system_settings")
    .update({ value, updated_at: new Date().toISOString() } as never)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/[locale]/(dashboard)/settings/system", "page");
  return { ok: true };
}
