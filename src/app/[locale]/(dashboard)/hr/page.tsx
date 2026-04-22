import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import type { Employee } from "@/lib/supabase/types";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface HRPageProps {
  params: Promise<{ locale: string }>;
}

export default async function HRPage({ params }: HRPageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("is_active", true)
    .order("full_name");

  const t = await getTranslations("hr");
  const tCommon = await getTranslations("common");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-paws-brown-dark">{t("title")}</h1>
        <Link href={`/${locale}/hr/new`}>
          <Button size="sm" className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white">
            <Plus className="w-4 h-4" /> {t("add_employee")}
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-paws-sand overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-paws-sand bg-paws-cream/50">
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{tCommon("name")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("department")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("position")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("hire_date")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("base_salary")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{tCommon("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {!employees || employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  {t("no_employees")}
                </td>
              </tr>
            ) : (
              (employees as Employee[]).map((emp) => (
                <tr key={emp.id} className="border-b border-paws-sand/50 hover:bg-paws-cream/30">
                  <td className="px-4 py-3 font-medium">{emp.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.department ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.position ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.hire_date}</td>
                  <td className="px-4 py-3 font-bold">{emp.salary_base} {tCommon("egp")}</td>
                  <td className="px-4 py-3">
                    <Link href={`/${locale}/hr/${emp.id}/edit`}>
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
