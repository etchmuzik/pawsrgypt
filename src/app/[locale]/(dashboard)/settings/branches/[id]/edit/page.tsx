import { createClient } from "@/lib/supabase/server";
import { BranchForm } from "@/components/dashboard/BranchForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale } from "next-intl/server";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

interface BranchRow {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
}

export default async function EditBranchPage({ params }: EditPageProps) {
  const { id } = await params;
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase
    .from("branches")
    .select("id, name, city, address, phone, is_active")
    .eq("id", id)
    .maybeSingle();

  const branch = data as BranchRow | null;
  if (!branch) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href={`/${locale}/settings/branches`}
        className="text-sm text-muted-foreground hover:text-paws-orange"
      >
        &larr; Back to Branches
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900 mt-2 mb-6">Edit Branch</h1>
      <BranchForm mode="edit" initial={branch} />
    </div>
  );
}
