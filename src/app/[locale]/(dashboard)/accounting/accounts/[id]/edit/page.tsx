import { createClient } from "@/lib/supabase/server";
import { AccountForm } from "@/components/dashboard/AccountForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { AccountType } from "@/app/[locale]/(dashboard)/accounting/accounts/actions";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

interface AccountRow {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  type: AccountType;
  parent_id: string | null;
  is_active: boolean;
}

interface ParentOption {
  id: string;
  code: string;
  name_en: string;
  type: string;
}

export default async function EditAccountPage({ params }: EditPageProps) {
  const { id } = await params;
  const locale = await getLocale();
  const supabase = await createClient();

  const [{ data: accountData }, { data: parentsData }] = await Promise.all([
    supabase
      .from("chart_of_accounts")
      .select("id, code, name_en, name_ar, type, parent_id, is_active")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("chart_of_accounts")
      .select("id, code, name_en, type")
      .order("code", { ascending: true }),
  ]);

  const account = accountData as AccountRow | null;
  if (!account) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href={`/${locale}/accounting/accounts`}
        className="text-sm text-muted-foreground hover:text-paws-orange"
      >
        &larr; Back to Chart of Accounts
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900 mt-2 mb-6">Edit Account</h1>
      <AccountForm mode="edit" initial={account} parents={(parentsData as ParentOption[]) ?? []} />
    </div>
  );
}
