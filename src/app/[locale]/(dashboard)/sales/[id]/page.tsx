import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Calendar, User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  type: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount: number;
  total: number;
  paid: number;
  notes: string | null;
  created_at: string;
  due_date: string | null;
  customers: { name: string; phone: string | null } | null;
};

type ItemRow = {
  id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  products: { name_en: string; name_ar: string; sku: string } | null;
};

type PaymentRow = {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, customers(name, phone)")
    .eq("id", id)
    .single();

  if (!invoice) notFound();
  const inv = invoice as unknown as InvoiceRow;

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*, products(name_en, name_ar, sku)")
    .eq("invoice_id", id);

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("invoice_id", id)
    .order("created_at", { ascending: false });

  const lineItems = (items ?? []) as unknown as ItemRow[];
  const paymentList = (payments ?? []) as unknown as PaymentRow[];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/sales`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 me-1" /> Back</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-paws-brown-dark">{inv.invoice_number}</h1>
            <span className={`inline-block mt-1 text-xs px-3 py-1 rounded-full font-semibold ${STATUS_COLORS[inv.status] ?? "bg-gray-100"}`}>
              {inv.status.toUpperCase()}
            </span>
          </div>
        </div>
        <Button variant="outline" className="gap-2"><Printer className="w-4 h-4" /> Print</Button>
      </div>

      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <User className="w-5 h-5 text-paws-orange mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Customer</p>
              <p className="font-semibold">{inv.customers?.name ?? "Walk-in"}</p>
              {inv.customers?.phone && <p className="text-sm text-gray-500">{inv.customers.phone}</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <Calendar className="w-5 h-5 text-paws-orange mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="font-semibold">{new Date(inv.created_at).toLocaleDateString("en-GB")}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <CreditCard className="w-5 h-5 text-paws-orange mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Type</p>
              <p className="font-semibold capitalize">{inv.type}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden mb-6">
        <div className="px-6 py-4 border-b"><h2 className="font-bold text-paws-brown-dark">Items</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-start px-6 py-3">Product</th>
              <th className="text-start px-4 py-3">SKU</th>
              <th className="text-center px-4 py-3">Qty</th>
              <th className="text-end px-4 py-3">Price</th>
              <th className="text-end px-6 py-3">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lineItems.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-3 font-medium">{locale === "ar" ? item.products?.name_ar : item.products?.name_en}</td>
                <td className="px-4 py-3 text-gray-500">{item.products?.sku}</td>
                <td className="px-4 py-3 text-center">{item.quantity}</td>
                <td className="px-4 py-3 text-end">{item.unit_price.toFixed(2)}</td>
                <td className="px-6 py-3 text-end font-semibold">{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t px-6 py-4 flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{inv.subtotal.toFixed(2)} EGP</span></div>
            {inv.discount > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-{inv.discount.toFixed(2)}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">VAT (14%)</span><span>{inv.tax_amount.toFixed(2)} EGP</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{inv.total.toFixed(2)} EGP</span></div>
            <div className="flex justify-between text-green-600"><span>Paid</span><span>{inv.paid.toFixed(2)} EGP</span></div>
            {inv.total - inv.paid > 0.01 && <div className="flex justify-between text-red-500 font-semibold"><span>Balance</span><span>{(inv.total - inv.paid).toFixed(2)} EGP</span></div>}
          </div>
        </div>
      </div>

      {paymentList.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden mb-6">
          <div className="px-6 py-4 border-b"><h2 className="font-bold text-paws-brown-dark">Payments</h2></div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-start px-6 py-3">Date</th>
                <th className="text-start px-4 py-3">Method</th>
                <th className="text-start px-4 py-3">Reference</th>
                <th className="text-end px-6 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paymentList.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-3">{new Date(p.created_at).toLocaleDateString("en-GB")}</td>
                  <td className="px-4 py-3 capitalize">{p.method}</td>
                  <td className="px-4 py-3 text-gray-500">{p.reference ?? "—"}</td>
                  <td className="px-6 py-3 text-end font-semibold text-green-600">{p.amount.toFixed(2)} EGP</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inv.notes && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-paws-brown-dark mb-2">Notes</h2>
          <p className="text-sm text-gray-600">{inv.notes}</p>
        </div>
      )}
    </div>
  );
}
