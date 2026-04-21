"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/supabase/types";

type Role = Profile["role"];

const ROLES: Role[] = ["admin", "manager", "cashier", "warehouse", "accountant", "hr"];

function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}

export interface UserFormInput {
  email: string;
  password?: string;
  full_name: string;
  role: string;
  branch_id: string | null;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export async function createUser(input: UserFormInput): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.full_name.trim();
  const password = input.password?.trim() ?? "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Valid email is required." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (!isRole(input.role)) {
    return { ok: false, error: "Invalid role." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Admin client not configured.",
    };
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createErr || !created.user) {
    return {
      ok: false,
      error: createErr?.message ?? "Failed to create auth user.",
    };
  }

  const userId = created.user.id;

  // handle_new_user trigger inserted a base row; update it with role/branch/full_name.
  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      full_name: fullName || null,
      role: input.role,
      branch_id: input.branch_id,
      is_active: true,
    } as never)
    .eq("id", userId);

  if (profileErr) {
    // Roll back auth user so we don't leave an orphan.
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: `Profile update failed: ${profileErr.message}` };
  }

  revalidatePath("/[locale]/(dashboard)/settings/users", "page");
  return { ok: true, id: userId };
}

export async function updateUser(
  id: string,
  input: Omit<UserFormInput, "password" | "email">,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing user id." };
  if (!isRole(input.role)) return { ok: false, error: "Invalid role." };

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Admin client not configured.",
    };
  }

  const fullName = input.full_name.trim();

  const { error } = await admin
    .from("profiles")
    .update({
      full_name: fullName || null,
      role: input.role,
      branch_id: input.branch_id,
    } as never)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  // Keep auth user metadata in sync so it shows up in Supabase Auth dashboard.
  await admin.auth.admin.updateUserById(id, {
    user_metadata: { full_name: fullName },
  });

  revalidatePath("/[locale]/(dashboard)/settings/users", "page");
  return { ok: true, id };
}

export async function setUserActive(id: string, isActive: boolean): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing user id." };

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Admin client not configured.",
    };
  }

  const { error } = await admin
    .from("profiles")
    .update({ is_active: isActive } as never)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  // Ban/unban in auth to actually block sign-in.
  await admin.auth.admin.updateUserById(id, {
    ban_duration: isActive ? "none" : "876000h", // ~100 years
  });

  revalidatePath("/[locale]/(dashboard)/settings/users", "page");
  return { ok: true, id };
}
