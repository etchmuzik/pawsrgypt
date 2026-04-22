"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface BranchInput {
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
}

interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

function validate(input: BranchInput): string | null {
  if (!input.name.trim()) return "Name is required";
  return null;
}

export async function createBranch(input: BranchInput): Promise<ActionResult> {
  const err = validate(input);
  if (err) return { success: false, error: err };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("branches")
    .insert({
      name: input.name.trim(),
      city: input.city?.trim() || null,
      address: input.address?.trim() || null,
      phone: input.phone?.trim() || null,
      is_active: input.is_active,
    } as never)
    .select("id")
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  revalidatePath("/[locale]/(dashboard)/settings/branches", "page");
  return { success: true, id: (data as { id: string } | null)?.id };
}

export async function updateBranch(id: string, input: BranchInput): Promise<ActionResult> {
  if (!id) return { success: false, error: "Missing id" };
  const err = validate(input);
  if (err) return { success: false, error: err };

  const supabase = await createClient();
  const { error } = await supabase
    .from("branches")
    .update({
      name: input.name.trim(),
      city: input.city?.trim() || null,
      address: input.address?.trim() || null,
      phone: input.phone?.trim() || null,
      is_active: input.is_active,
    } as never)
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/[locale]/(dashboard)/settings/branches", "page");
  return { success: true, id };
}

export async function toggleBranchActive(id: string, isActive: boolean): Promise<ActionResult> {
  if (!id) return { success: false, error: "Missing id" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("branches")
    .update({ is_active: isActive } as never)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/[locale]/(dashboard)/settings/branches", "page");
  return { success: true };
}
