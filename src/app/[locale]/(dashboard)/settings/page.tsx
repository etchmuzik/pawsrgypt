import { Card } from "@/components/ui/card";
import { Users, Building2, Shield, Bell, Settings } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export default async function SettingsPage() {
  const locale = await getLocale();
  const t = await getTranslations("settings");

  const modules = [
    { icon: Users, title: t("users"), desc: t("subtitle"), href: `/${locale}/settings/users`, color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Shield, title: t("roles"), desc: t("roles"), href: `/${locale}/settings/roles`, color: "text-purple-600", bg: "bg-purple-50" },
    { icon: Building2, title: t("branches"), desc: t("branches"), href: `/${locale}/settings/branches`, color: "text-green-600", bg: "bg-green-50" },
    { icon: Bell, title: t("notifications"), desc: t("notifications"), href: `/${locale}/settings/notifications`, color: "text-paws-orange", bg: "bg-orange-50" },
    { icon: Settings, title: t("system"), desc: t("system"), href: `/${locale}/settings/system`, color: "text-gray-600", bg: "bg-gray-50" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">{t("title")}</h1>
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
