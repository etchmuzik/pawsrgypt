import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import type { Invoice } from "@/lib/supabase/types";

async function getInvoices(): Promise<Invoice[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("type", "sale")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as Invoice[]) ?? [];
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  confirmed: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
};

export default async function SalesPage() {
  const invoices = await getInvoices();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-paws-brown-dark">Sales</h1>
        <Button size="sm" className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white">
          <Plus className="w-4 h-4" /> New Invoice
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-paws-sand overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-paws-sand bg-paws-cream/50">
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">#</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Customer</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Date</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Total</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Paid</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Status</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No invoices yet.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-paws-sand/50 hover:bg-paws-cream/30">
                  <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-bold">{inv.total} EGP</td>
                  <td className="px-4 py-3">{inv.paid} EGP</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[inv.status] ?? ""}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">View</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
