import { createClient } from "@/lib/supabase/server";
import { JournalEntryForm } from "@/components/dashboard/JournalEntryForm";
import Link from "next/link";
import { getLocale } from "next-intl/server";

interface AccountOption {
  id: string;
  code: string;
  name_en: string;
  type: string;
}

interface BranchOption {
  id: string;
  name: string;
}

export default async function NewJournalEntryPage() {
  const locale = await getLocale();
  const supabase = await createClient();

  const [{ data: accountsData }, { data: branchesData }] = await Promise.all([
    supabase
      .from("chart_of_accounts")
      .select("id, code, name_en, type")
      .eq("is_active", true)
      .order("code", { ascending: true }),
    supabase
      .from("branches")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  return (
    <div className="max-w-5xl">
      <Link
        href={`/${locale}/accounting/journal`}
        className="text-sm text-muted-foreground hover:text-paws-orange"
      >
        &larr; Back to Journal
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900 mt-2 mb-6">New Journal Entry</h1>
      <JournalEntryForm
        accounts={(accountsData as AccountOption[]) ?? []}
        branches={(branchesData as BranchOption[]) ?? []}
      />
    </div>
  );
}
