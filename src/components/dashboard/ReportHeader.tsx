import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

interface ReportHeaderProps {
  title: string;
  subtitle?: string;
}

export async function ReportHeader({ title, subtitle }: ReportHeaderProps) {
  const locale = await getLocale();
  const t = await getTranslations("dashboard");

  return (
    <div className="mb-6">
      <Link
        href={`/${locale}/accounting/reports`}
        className="text-sm text-muted-foreground hover:text-paws-orange transition-colors"
      >
        &larr; {t("back_to_reports")}
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900 mt-2">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}
