import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Plus, BarChart3 } from "lucide-react";
import { getTranslations } from "next-intl/server";

async function getStockSummary() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock")
    .select("*, products(name_en, sku), warehouses(name)")
    .order("quantity", { ascending: true })
    .limit(20);
  return data ?? [];
}

export default async function InventoryPage() {
  const stock = await getStockSummary();
  const t = await getTranslations("inventory");
  const tCommon = await getTranslations("common");
  const tDash = await getTranslations("dashboard");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-paws-brown-dark">{t("title")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 border-paws-sand">
            <ArrowLeftRight className="w-4 h-4" /> {t("transfer")}
          </Button>
          <Button size="sm" className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white">
            <Plus className="w-4 h-4" /> {t("adjust")}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 border-paws-sand">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("total_skus")}</p>
              <p className="text-xl font-bold text-paws-brown-dark">{stock.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-paws-sand">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-paws-orange" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{tDash("low_stock")}</p>
              <p className="text-xl font-bold text-paws-brown-dark">
                {stock.filter((s) => (s as { quantity: number }).quantity <= (s as { min_quantity: number }).min_quantity).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-paws-sand">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("out_of_stock")}</p>
              <p className="text-xl font-bold text-paws-brown-dark">
                {stock.filter((s) => (s as { quantity: number }).quantity === 0).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl border border-paws-sand overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-paws-sand bg-paws-cream/50">
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("product")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("warehouse")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("qty")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{t("min_qty")}</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">{tCommon("status")}</th>
            </tr>
          </thead>
          <tbody>
            {stock.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  {t("no_stock")}
                </td>
              </tr>
            ) : (
              stock.map((s) => {
                const row = s as { id: string; quantity: number; min_quantity: number; products?: { name_en: string; sku: string } | null; warehouses?: { name: string } | null };
                const isLow = row.quantity <= row.min_quantity;
                const isOut = row.quantity === 0;
                return (
                  <tr key={row.id} className="border-b border-paws-sand/50 hover:bg-paws-cream/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.products?.name_en ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{row.products?.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.warehouses?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-bold">{row.quantity}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.min_quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isOut ? "bg-red-100 text-red-700" : isLow ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                        {isOut ? t("out_of_stock") : isLow ? tDash("low_stock") : t("ok")}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
