import { createClient } from "@/lib/supabase/server";
import { TreasuryAccountForm } from "@/components/dashboard/TreasuryAccountForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { TreasuryType } from "@/app/[locale]/(dashboard)/accounting/treasury/actions";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

interface TreasuryRow {
  id: string;
  name_en: string;
  name_ar: string;
  type: TreasuryType;
  currency: string;
  branch_id: string | null;
  balance: number;
  is_active: boolean;
}

interface BranchOption {
  id: string;
  name: string;
}

export default async function EditTreasuryAccountPage({ params }: EditPageProps) {
  const { id } = await params;
  const locale = await getLocale();
  const supabase = await createClient();

  const [{ data: acctData }, { data: branchesData }] = await Promise.all([
    supabase
      .from("treasury_accounts")
      .select("id, name_en, name_ar, type, currency, branch_id, balance, is_active")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("branches")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  const account = acctData as TreasuryRow | null;
  if (!account) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href={`/${locale}/accounting/treasury`}
        className="text-sm text-muted-foreground hover:text-paws-orange"
      >
        &larr; Back to Treasury
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900 mt-2 mb-6">Edit Treasury Account</h1>
      <TreasuryAccountForm mode="edit" initial={account} branches={(branchesData as BranchOption[]) ?? []} />
    </div>
  );
}
