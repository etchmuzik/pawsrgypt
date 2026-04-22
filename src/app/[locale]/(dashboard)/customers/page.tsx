import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil } from "lucide-react";
import type { Customer } from "@/lib/supabase/types";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface CustomersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CustomersPage({ params }: CustomersPageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  const t = await getTranslations("customers");
  const tCommon = await getTranslations("common");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-paws-brown-dark">{t("title")}</h1>
        <Link href={`/${locale}/customers/new`}>
          <Button size="sm" className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white">
            <Plus className="w-4 h-4" /> {t("add")}
          </Button>
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={`${tCommon("search")}...`} className="ps-9 bg-white border-paws-sand max-w-sm" />
      </div>

      <div className="bg-white rounded-2xl border border-paws-sand overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-paws-sand bg-paws-cream/50">
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("name")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("phone")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("balance")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("credit_limit")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{tCommon("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {!customers || customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  {t("no_customers")}
                </td>
              </tr>
            ) : (
              (customers as Customer[]).map((c) => (
                <tr key={c.id} className="border-b border-paws-sand/50 hover:bg-paws-cream/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3">{c.balance} {tCommon("egp")}</td>
                  <td className="px-4 py-3">{c.credit_limit} {tCommon("egp")}</td>
                  <td className="px-4 py-3">
                    <Link href={`/${locale}/customers/${c.id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-paws-orange hover:text-paws-orange/80">
                        <Pencil className="w-3.5 h-3.5" /> {tCommon("edit")}
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
