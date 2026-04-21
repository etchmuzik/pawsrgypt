import { createClient } from "@/lib/supabase/server";
import { UserForm } from "@/components/dashboard/UserForm";
import type { Branch } from "@/lib/supabase/types";

async function getBranches(): Promise<Branch[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("branches")
    .select("id, name")
    .eq("is_active", true)
    .order("name");
  return (data as Branch[]) ?? [];
}

export default async function NewUserPage() {
  const branches = await getBranches();
  return <UserForm mode="create" branches={branches} />;
}
