import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Landmark, Banknote, Building2 } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { TreasuryTransferDialog } from "@/components/dashboard/TreasuryTransferDialog";

type TreasuryType = "cash" | "bank";

type TreasuryAccount = {
  id: string;
  name_en: string;
  name_ar: string;
  type: TreasuryType;
  balance: number;
  currency: string;
  branch_id: string | null;
  is_active: boolean;
  branches: { name: string } | null;
};

async function getTreasuryAccounts(): Promise<TreasuryAccount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("treasury_accounts")
    .select("id, name_en, name_ar, type, balance, currency, branch_id, is_active, branches(name)")
    .order("type", { ascending: true })
    .order("name_en", { ascending: true });

  if (error) return [];
  return (data as TreasuryAccount[]) ?? [];
}

function formatCurrency(amount: number, currency = "EGP"): string {
  return `${amount.toLocaleString("en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export default async function TreasuryPage() {
  const locale = await getLocale();
  const accounts = await getTreasuryAccounts();
  const t = await getTranslations("accounting");
  const tCommon = await getTranslations("common");
  const tDash = await getTranslations("dashboard");
  const labels = {
    totalBalance: locale === "ar" ? "الرصيد الإجمالي" : "Total Balance",
    cash: locale === "ar" ? "كاش" : "Cash",
    bank: locale === "ar" ? "بنك" : "Bank",
    inactive: locale === "ar" ? "غير مفعل" : "Inactive",
    branch: locale === "ar" ? "الفرع" : "Branch",
  };
  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);
  const cashAccounts = accounts.filter((a) => a.type === "cash");
  const bankAccounts = accounts.filter((a) => a.type === "bank");

  const activeAccounts = accounts.filter((a) => a.is_active);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-paws-brown-dark">{t("treasury")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <TreasuryTransferDialog accounts={activeAccounts.map((a) => ({
            id: a.id,
            name_en: a.name_en,
            currency: a.currency,
            balance: Number(a.balance),
          }))} />
          <Link href={`/${locale}/accounting/treasury/new`}>
            <Button className="bg-paws-orange hover:bg-paws-orange/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              {t("add_treasury")}
            </Button>
          </Link>
        </div>
      </div>

      {accounts.length === 0 ? (
        <Card className="p-12 border-paws-sand text-center">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Landmark className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-paws-brown-dark mb-2">{tCommon("no_data")}</h3>
          <Link href={`/${locale}/accounting/treasury/new`}>
            <Button className="bg-paws-orange hover:bg-paws-orange/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              {t("add_treasury")}
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          <Card className="p-6 border-paws-sand mb-6 bg-gradient-to-r from-paws-cream to-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-paws-orange/10 rounded-xl flex items-center justify-center">
                <Landmark className="w-6 h-6 text-paws-orange" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{labels.totalBalance}</p>
                <p className="text-3xl font-bold text-paws-brown-dark">{formatCurrency(totalBalance)}</p>
              </div>
            </div>
            <div className="flex gap-6 mt-4 pt-4 border-t border-paws-sand/50">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-green-600" />
                <span className="text-sm text-muted-foreground">
                  {labels.cash}: {cashAccounts.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">
                  {labels.bank}: {bankAccounts.length}
                </span>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => {
              const isCash = account.type === "cash";
              const Icon = isCash ? Banknote : Building2;
              const iconColor = isCash ? "text-green-600" : "text-blue-600";
              const iconBg = isCash ? "bg-green-50" : "bg-blue-50";

              return (
                <Link
                  key={account.id}
                  href={`/${locale}/accounting/treasury/${account.id}/edit`}
                  className="block"
                >
                  <Card className="p-5 border-paws-sand hover:border-paws-orange hover:shadow-md transition-all cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isCash ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>
                          {isCash ? labels.cash : labels.bank}
                        </span>
                        {!account.is_active && (
                          <span className="text-xs bg-gray-100 text-muted-foreground px-2 py-0.5 rounded-full">
                            {labels.inactive}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-semibold text-paws-brown-dark text-sm">{account.name_en}</h3>
                    <p className="text-xs text-muted-foreground mb-3" dir="rtl">{account.name_ar}</p>

                    <div className="pt-3 border-t border-paws-sand/50">
                      <p className="text-xl font-bold text-paws-brown-dark">
                        {formatCurrency(Number(account.balance), account.currency)}
                      </p>
                      {account.branches?.name && (
                        <p className="text-xs text-muted-foreground mt-1">{labels.branch}: {account.branches.name}</p>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-6">
        <Link
          href={`/${locale}/accounting`}
          className="text-sm text-muted-foreground hover:text-paws-orange transition-colors"
        >
          &larr; {tDash("back_to_accounting")}
        </Link>
      </div>
    </div>
  );
}
