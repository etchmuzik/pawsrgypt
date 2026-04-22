"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ModuleKey =
  | "dashboard"
  | "pos"
  | "products"
  | "inventory"
  | "purchases"
  | "sales"
  | "customers"
  | "accounting"
  | "hr"
  | "settings";

export type RoleKey = "admin" | "manager" | "cashier" | "warehouse" | "accountant" | "hr";

export type RolePermissions = Record<RoleKey, Record<ModuleKey, boolean>>;

interface ActionResult {
  success: boolean;
  error?: string;
}

const SETTING_KEY = "role_permissions";

export async function saveRolePermissions(permissions: RolePermissions): Promise<ActionResult> {
  const supabase = await createClient();

  const serialized = JSON.stringify(permissions);

  const { data: existing } = await supabase
    .from("system_settings")
    .select("id")
    .eq("key", SETTING_KEY)
    .is("branch_id", null)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("system_settings")
      .update({ value: serialized, updated_at: new Date().toISOString() } as never)
      .eq("id", (existing as { id: string }).id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("system_settings")
      .insert({ key: SETTING_KEY, value: serialized, branch_id: null } as never);
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/[locale]/(dashboard)/settings/roles", "page");
  return { success: true };
}
