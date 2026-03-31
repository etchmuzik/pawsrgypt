import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ArrowDownUp } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";

async function getCashFlow() {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select("amount, method, created_at")
    .order("created_at", { ascending: false });

  type Payment = { amount: number; method: string; created_at: string };
  const all = (payments as Payment[] | null) ?? [];

  const totalCash = all.filter((p) => p.method === "cash").reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalCard = all.filter((p) => p.method === "card").reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalTransfer = all.filter((p) => p.method === "transfer").reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalAll = all.reduce((s, p) => s + (p.amount ?? 0), 0);

  return { totalCash, totalCard, totalTransfer, totalAll, count: all.length };
}

function fmt(n: number) {
  return n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function CashFlowPage() {
  const locale = await getLocale();
  const data = await getCashFlow();

  const methods = [
    { label: "Cash Payments", value: data.totalCash, color: "text-green-600" },
    { label: "Card Payments", value: data.totalCard, color: "text-blue-600" },
    { label: "Bank Transfers", value: data.totalTransfer, color: "text-purple-600" },
  ];

  return (
    <div>
      <div className="mb-6">
        <Link href={`/${locale}/accounting/reports`} className="text-sm text-muted-foreground hover:text-paws-orange transition-colors">
          &larr; Back to Reports
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 mt-2">Cash Flow</h1>
        <p className="text-sm text-muted-foreground mt-1">Cash inflows by payment method</p>
      </div>

      <Card className="p-5 border-neutral-200 mb-6">
        <span className="text-sm text-muted-foreground">Total Cash Inflow</span>
        <p className="text-3xl font-bold text-neutral-900 mt-1">{fmt(data.totalAll)} EGP</p>
        <p className="text-xs text-muted-foreground mt-1">{data.count} payments recorded</p>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {methods.map((m) => (
          <Card key={m.label} className="p-5 border-neutral-200">
            <span className="text-sm text-muted-foreground">{m.label}</span>
            <p className={`text-xl font-bold mt-2 ${m.color}`}>{fmt(m.value)} EGP</p>
          </Card>
        ))}
      </div>

      {data.count === 0 && (
        <Card className="p-12 border-neutral-200 text-center">
          <ArrowDownUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-900 mb-1">No payments yet</h3>
          <p className="text-sm text-muted-foreground">Process sales to see cash flow data.</p>
        </Card>
      )}
    </div>
  );
}
