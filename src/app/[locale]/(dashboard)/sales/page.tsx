import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface InvoiceWithCustomer {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  total: number;
  paid: number;
  status: string;
  created_at: string;
  customers: { name: string } | null;
}

async function getInvoices(): Promise<InvoiceWithCustomer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, invoice_number, customer_id, total, paid, status, created_at, customers(name)")
    .eq("type", "sale")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as InvoiceWithCustomer[] | null) ?? [];
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  confirmed: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SalesPage({ params }: PageProps) {
  const { locale } = await params;
  const invoices = await getInvoices();
  const t = await getTranslations("sales");
  const tCommon = await getTranslations("common");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-paws-brown-dark">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {invoices.length} {t("invoices").toLowerCase()}
          </p>
        </div>
        <Link href={`/${locale}/sales/new`}>
          <Button size="sm" className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white">
            <Plus className="w-4 h-4" /> {t("new_invoice")}
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-paws-sand overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paws-sand bg-paws-cream/50">
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">#</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("customer")}</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("date")}</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("total")}</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("paid")}</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("status")}</th>
                <th className="text-start px-4 py-3 font-semibold text-paws-brown">{tCommon("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    {t("no_sales")}
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-paws-sand/50 hover:bg-paws-cream/30">
                    <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                    <td className="px-4 py-3 font-medium text-paws-brown-dark">
                      {inv.customers?.name ?? t("walk_in")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(inv.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-EG")}
                    </td>
                    <td className="px-4 py-3 font-semibold">{inv.total.toLocaleString()} {tCommon("egp")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.paid.toLocaleString()} {tCommon("egp")}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[inv.status] ?? ""}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/${locale}/sales/${inv.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-paws-orange hover:text-paws-orange/80">
                          {tCommon("view")}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
