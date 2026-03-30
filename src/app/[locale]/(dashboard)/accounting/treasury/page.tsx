import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Landmark, Banknote, Building2 } from "lucide-react";
import Link from "next/link";

type TreasuryAccount = {
  id: string;
  name_en: string;
  name_ar: string;
  type: string;
  balance: number;
  currency: string;
  branch: string | null;
  is_active: boolean;
};

async function getTreasuryAccounts(): Promise<TreasuryAccount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("treasury_accounts")
    .select("id, name_en, name_ar, type, balance, currency, branch, is_active")
    .order("type", { ascending: true })
    .order("name_en", { ascending: true });

  if (error) {
    return [];
  }

  return (data as TreasuryAccount[]) ?? [];
}

function formatCurrency(amount: number, currency = "EGP"): string {
  return `${amount.toLocaleString("en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export default async function TreasuryPage() {
  const accounts = await getTreasuryAccounts();
  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);
  const cashAccounts = accounts.filter((a) => a.type === "cash");
  const bankAccounts = accounts.filter((a) => a.type === "bank");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-paws-brown-dark">Treasury</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage cash and bank accounts
          </p>
        </div>
        <Button className="bg-paws-orange hover:bg-paws-orange/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card className="p-12 border-paws-sand text-center">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Landmark className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-paws-brown-dark mb-2">
            No treasury accounts
          </h3>
          <p className="text-muted-foreground mb-4">
            Add your first cash or bank account to start tracking balances.
          </p>
          <Button className="bg-paws-orange hover:bg-paws-orange/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </Card>
      ) : (
        <>
          {/* Total Balance Summary */}
          <Card className="p-6 border-paws-sand mb-6 bg-gradient-to-r from-paws-cream to-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-paws-orange/10 rounded-xl flex items-center justify-center">
                <Landmark className="w-6 h-6 text-paws-orange" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-3xl font-bold text-paws-brown-dark">
                  {formatCurrency(totalBalance)}
                </p>
              </div>
            </div>
            <div className="flex gap-6 mt-4 pt-4 border-t border-paws-sand/50">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-green-600" />
                <span className="text-sm text-muted-foreground">
                  Cash: {cashAccounts.length} account{cashAccounts.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">
                  Bank: {bankAccounts.length} account{bankAccounts.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </Card>

          {/* Account Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => {
              const isCash = account.type === "cash";
              const Icon = isCash ? Banknote : Building2;
              const iconColor = isCash ? "text-green-600" : "text-blue-600";
              const iconBg = isCash ? "bg-green-50" : "bg-blue-50";

              return (
                <Card
                  key={account.id}
                  className="p-5 border-paws-sand hover:border-paws-orange hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isCash
                            ? "bg-green-50 text-green-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {isCash ? "Cash" : "Bank"}
                      </span>
                      {!account.is_active && (
                        <span className="text-xs bg-gray-100 text-muted-foreground px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-paws-brown-dark text-sm">
                    {account.name_en}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3" dir="rtl">
                    {account.name_ar}
                  </p>

                  <div className="pt-3 border-t border-paws-sand/50">
                    <p className="text-xl font-bold text-paws-brown-dark">
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                    {account.branch && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Branch: {account.branch}
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-6">
        <Link
          href="/accounting"
          className="text-sm text-muted-foreground hover:text-paws-orange transition-colors"
        >
          &larr; Back to Accounting
        </Link>
      </div>
    </div>
  );
}
