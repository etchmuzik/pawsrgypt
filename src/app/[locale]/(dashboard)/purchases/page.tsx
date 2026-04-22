import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PurchasesPage({ params }: PageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const t = await getTranslations("purchases");
  const tCommon = await getTranslations("common");

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
        <h1 className="text-2xl font-bold text-paws-brown-dark">{t("title")}</h1>
        <Link href={`/${locale}/purchases/new`}>
          <Button size="sm" className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white">
            <Plus className="w-4 h-4" /> {t("new_order")}
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-paws-sand overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-paws-sand bg-paws-cream/50">
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">#</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("supplier")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{tCommon("date")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{tCommon("total")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{tCommon("status")}</th>
            </tr>
          </thead>
          <tbody>
            {!orders || orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  {t("no_orders")}
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-paws-sand/50 hover:bg-paws-cream/30 cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link href={`/${locale}/purchases/${order.id}`} className="text-paws-orange hover:underline">
                      {order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/${locale}/purchases/${order.id}`} className="hover:underline">
                      {order.suppliers?.name ?? "---"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-bold">{order.total} EGP</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        order.status === "received"
                          ? "bg-green-100 text-green-700"
                          : order.status === "ordered"
                            ? "bg-blue-100 text-blue-700"
                            : order.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
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
