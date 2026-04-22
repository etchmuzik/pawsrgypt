import { createClient } from "@/lib/supabase/server";
import { AccountForm } from "@/components/dashboard/AccountForm";
import Link from "next/link";
import { getLocale } from "next-intl/server";

interface ParentOption {
  id: string;
  code: string;
  name_en: string;
  type: string;
}

export default async function NewAccountPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase
    .from("chart_of_accounts")
    .select("id, code, name_en, type")
    .eq("is_active", true)
    .order("code", { ascending: true });

  return (
    <div className="max-w-2xl">
      <Link
        href={`/${locale}/accounting/accounts`}
        className="text-sm text-muted-foreground hover:text-paws-orange"
      >
        &larr; Back to Chart of Accounts
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900 mt-2 mb-6">New Account</h1>
      <AccountForm mode="create" parents={(data as ParentOption[]) ?? []} />
    </div>
  );
}
