import { Card } from "@/components/ui/card";
import { BookOpen, TrendingUp, Landmark, FileText } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";

export default async function AccountingPage() {
  const locale = await getLocale();

  const modules = [
    { icon: BookOpen, title: "Chart of Accounts", desc: "Manage your account structure", href: `/${locale}/accounting/accounts`, color: "text-blue-600", bg: "bg-blue-50" },
    { icon: TrendingUp, title: "Journal Entries", desc: "View and create journal entries", href: `/${locale}/accounting/journal`, color: "text-green-600", bg: "bg-green-50" },
    { icon: Landmark, title: "Treasury", desc: "Manage cash and bank accounts", href: `/${locale}/accounting/treasury`, color: "text-purple-600", bg: "bg-purple-50" },
    { icon: FileText, title: "Reports", desc: "P&L, Balance Sheet, VAT, Cash Flow", href: `/${locale}/accounting/reports`, color: "text-paws-orange", bg: "bg-orange-50" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Accounting</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {modules.map((mod) => (
          <Link key={mod.title} href={mod.href}>
            <Card className="p-6 border-neutral-200 hover:border-paws-orange hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${mod.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <mod.icon className={`w-6 h-6 ${mod.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900">{mod.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{mod.desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
