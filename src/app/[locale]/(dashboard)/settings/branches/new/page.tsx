import { BranchForm } from "@/components/dashboard/BranchForm";
import Link from "next/link";
import { getLocale } from "next-intl/server";

export default async function NewBranchPage() {
  const locale = await getLocale();
  return (
    <div className="max-w-2xl">
      <Link
        href={`/${locale}/settings/branches`}
        className="text-sm text-muted-foreground hover:text-paws-orange"
      >
        &larr; Back to Branches
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900 mt-2 mb-6">New Branch</h1>
      <BranchForm mode="create" />
    </div>
  );
}
