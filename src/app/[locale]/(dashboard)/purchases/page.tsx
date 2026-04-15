import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PurchasesPage({ params }: PageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  type PurchaseOrderRow = {
    id: string;
    created_at: string;
    total: number;
    status: string;
    suppliers?: { name: string } | null;
  };

  const { data: rawOrders } = await supabase
    .from("purchase_orders")
    .select("*, suppliers(name)")
    .order("created_at", { ascending: false })
    .limit(50);
  const orders = rawOrders as PurchaseOrderRow[] | null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-paws-brown-dark">Purchases</h1>
        <Link href={`/${locale}/purchases/new`}>
          <Button size="sm" className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white">
            <Plus className="w-4 h-4" /> New Purchase Order
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-paws-sand overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-paws-sand bg-paws-cream/50">
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">ID</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Supplier</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Date</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Total</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Status</th>
            </tr>
          </thead>
          <tbody>
            {!orders || orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No purchase orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-paws-sand/50 hover:bg-paws-cream/30">
                  <td className="px-4 py-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{order.suppliers?.name ?? "---"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-bold">{order.total} EGP</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
