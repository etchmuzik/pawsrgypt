import { createClient } from "@/lib/supabase/server";
import { TreasuryAccountForm } from "@/components/dashboard/TreasuryAccountForm";
import Link from "next/link";
import { getLocale } from "next-intl/server";

interface BranchOption {
  id: string;
  name: string;
}

export default async function NewTreasuryAccountPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase
    .from("branches")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (
    <div className="max-w-2xl">
      <Link
        href={`/${locale}/accounting/treasury`}
        className="text-sm text-muted-foreground hover:text-paws-orange"
      >
        &larr; Back to Treasury
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900 mt-2 mb-6">New Treasury Account</h1>
      <TreasuryAccountForm mode="create" branches={(data as BranchOption[]) ?? []} />
    </div>
  );
}
