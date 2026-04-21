import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserForm } from "@/components/dashboard/UserForm";
import type { Branch, Profile } from "@/lib/supabase/types";

interface EditUserPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: profile }, { data: branchesData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase.from("branches").select("id, name").eq("is_active", true).order("name"),
  ]);

  if (!profile) {
    notFound();
  }

  const p = profile as Profile;
  const branches = (branchesData as Branch[]) ?? [];

  return (
    <UserForm
      mode="edit"
      branches={branches}
      initial={{
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        role: p.role,
        branch_id: p.branch_id,
      }}
    />
  );
}
