import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import type { Supplier } from "@/lib/supabase/types";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface SuppliersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SuppliersPage({ params }: SuppliersPageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const t = await getTranslations("purchases");
  const tCommon = await getTranslations("common");
  const tSettings = await getTranslations("settings");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-paws-brown-dark">{t("suppliers")}</h1>
        <Link href={`/${locale}/purchases/suppliers/new`}>
          <Button
            size="sm"
            className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white"
          >
            <Plus className="w-4 h-4" /> {tCommon("add")} {t("supplier")}
          </Button>
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={`${tCommon("search")}...`}
          className="ps-9 bg-white border-paws-sand max-w-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-paws-sand overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-paws-sand bg-paws-cream/50">
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{tCommon("name")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{tCommon("phone")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{tCommon("email")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{tCommon("total")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{tCommon("status")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{tCommon("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {!suppliers || suppliers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {tCommon("no_data")}
                </td>
              </tr>
            ) : (
              (suppliers as Supplier[]).map((supplier) => (
                <tr
                  key={supplier.id}
                  className="border-b border-paws-sand/50 hover:bg-paws-cream/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-paws-brown-dark">
                    {supplier.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {supplier.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {supplier.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {supplier.balance} {tCommon("egp")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={supplier.is_active ? "default" : "secondary"}
                      className={
                        supplier.is_active
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : ""
                      }
                    >
                      {supplier.is_active ? tSettings("active") : tSettings("inactive")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                    >
                      {tCommon("edit")}
                    </Button>
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
