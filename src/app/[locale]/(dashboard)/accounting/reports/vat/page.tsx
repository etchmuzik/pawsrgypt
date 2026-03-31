import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";

async function getVATData() {
  const supabase = await createClient();

  const { data: salesInvoices } = await supabase
    .from("invoices")
    .select("subtotal, tax, total")
    .eq("type", "sale");

  const { data: purchaseOrders } = await supabase
    .from("purchase_orders")
    .select("subtotal, tax, total");

  type Row = { subtotal: number; tax: number; total: number };
  const sales = (salesInvoices as Row[] | null) ?? [];
  const purchases = (purchaseOrders as Row[] | null) ?? [];

  const vatCollected = sales.reduce((s, r) => s + (r.tax ?? 0), 0);
  const vatPaid = purchases.reduce((s, r) => s + (r.tax ?? 0), 0);
  const salesTotal = sales.reduce((s, r) => s + (r.total ?? 0), 0);
  const purchasesTotal = purchases.reduce((s, r) => s + (r.total ?? 0), 0);

  return { vatCollected, vatPaid, netVAT: vatCollected - vatPaid, salesTotal, purchasesTotal, salesCount: sales.length, purchasesCount: purchases.length };
}

function fmt(n: number) {
  return n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function VATReportPage() {
  const locale = await getLocale();
  const data = await getVATData();

  return (
    <div>
      <div className="mb-6">
        <Link href={`/${locale}/accounting/reports`} className="text-sm text-muted-foreground hover:text-paws-orange transition-colors">
          &larr; Back to Reports
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 mt-2">VAT Report</h1>
        <p className="text-sm text-muted-foreground mt-1">VAT collected and paid summary (14% rate)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">VAT Collected (Sales)</span>
          <p className="text-2xl font-bold text-green-600 mt-2">{fmt(data.vatCollected)} EGP</p>
          <p className="text-xs text-muted-foreground mt-1">{data.salesCount} invoices | {fmt(data.salesTotal)} EGP total</p>
        </Card>
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">VAT Paid (Purchases)</span>
          <p className="text-2xl font-bold text-red-600 mt-2">{fmt(data.vatPaid)} EGP</p>
          <p className="text-xs text-muted-foreground mt-1">{data.purchasesCount} orders | {fmt(data.purchasesTotal)} EGP total</p>
        </Card>
        <Card className="p-5 border-neutral-200">
          <span className="text-sm text-muted-foreground">Net VAT Payable</span>
          <p className={`text-2xl font-bold mt-2 ${data.netVAT >= 0 ? "text-paws-orange" : "text-green-600"}`}>
            {fmt(data.netVAT)} EGP
          </p>
          <p className="text-xs text-muted-foreground mt-1">{data.netVAT >= 0 ? "Amount due to tax authority" : "Refundable credit"}</p>
        </Card>
      </div>

      {data.salesCount === 0 && data.purchasesCount === 0 && (
        <Card className="p-12 border-neutral-200 text-center">
          <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-900 mb-1">No VAT data</h3>
          <p className="text-sm text-muted-foreground">Create sales or purchase transactions to generate VAT data.</p>
        </Card>
      )}
    </div>
  );
}
