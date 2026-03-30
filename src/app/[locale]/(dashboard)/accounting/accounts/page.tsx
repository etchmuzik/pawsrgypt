import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";

type Account = {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  type: string;
  parent_id: string | null;
  is_active: boolean;
};

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  asset: { label: "Asset", color: "text-blue-700", bg: "bg-blue-50" },
  liability: { label: "Liability", color: "text-red-700", bg: "bg-red-50" },
  equity: { label: "Equity", color: "text-purple-700", bg: "bg-purple-50" },
  income: { label: "Income", color: "text-green-700", bg: "bg-green-50" },
  expense: { label: "Expense", color: "text-orange-700", bg: "bg-orange-50" },
};

async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chart_of_accounts")
    .select("id, code, name_en, name_ar, type, parent_id, is_active")
    .order("code", { ascending: true });

  if (error) {
    return [];
  }

  return (data as Account[]) ?? [];
}

function groupByType(accounts: Account[]): Record<string, Account[]> {
  const groups: Record<string, Account[]> = {};
  for (const account of accounts) {
    const type = account.type ?? "other";
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type] = [...groups[type], account];
  }
  return groups;
}

export default async function ChartOfAccountsPage() {
  const accounts = await getAccounts();
  const grouped = groupByType(accounts);
  const typeOrder = ["asset", "liability", "equity", "income", "expense"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-paws-brown-dark">Chart of Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account structure and hierarchy
          </p>
        </div>
        <Button className="bg-paws-orange hover:bg-paws-orange/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card className="p-12 border-paws-sand text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-paws-brown-dark mb-2">No accounts yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first account to start building your chart of accounts.
          </p>
          <Button className="bg-paws-orange hover:bg-paws-orange/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {typeOrder.map((type) => {
            const typeAccounts = grouped[type];
            if (!typeAccounts || typeAccounts.length === 0) return null;
            const config = TYPE_CONFIG[type] ?? {
              label: type,
              color: "text-gray-700",
              bg: "bg-gray-50",
            };

            return (
              <Card key={type} className="border-paws-sand overflow-hidden">
                <div className="px-5 py-3 border-b border-paws-sand bg-paws-cream/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
                    >
                      {config.label}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {typeAccounts.length} account{typeAccounts.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-paws-sand/50">
                  {typeAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="px-5 py-3 flex items-center justify-between hover:bg-paws-cream/20 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-mono text-muted-foreground w-16">
                          {account.code}
                        </span>
                        <div>
                          <p className="font-medium text-paws-brown-dark text-sm">
                            {account.name_en}
                          </p>
                          <p className="text-xs text-muted-foreground" dir="rtl">
                            {account.name_ar}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!account.is_active && (
                          <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded">
                            Inactive
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-4">
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
