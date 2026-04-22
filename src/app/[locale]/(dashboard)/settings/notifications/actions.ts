"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NotificationKey = "new_order" | "low_stock" | "new_customer" | "purchase_received";

export type NotificationSettings = Record<NotificationKey, { email: boolean; sms: boolean }>;

interface ActionResult {
  success: boolean;
  error?: string;
}

function settingKey(userId: string): string {
  return `notification_settings:${userId}`;
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return { success: false, error: "Not authenticated" };

  const key = settingKey(user.id);
  const serialized = JSON.stringify(settings);

  const { data: existing } = await supabase
    .from("system_settings")
    .select("id")
    .eq("key", key)
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
      .insert({ key, value: serialized, branch_id: null } as never);
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/[locale]/(dashboard)/settings/notifications", "page");
  return { success: true };
}
