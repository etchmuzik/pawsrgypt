import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { PurchaseOrderActions } from "@/components/dashboard/PurchaseOrderActions";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface PurchaseDetailProps {
  params: Promise<{ id: string; locale: string }>;
}

interface PurchaseOrderDetail {
  id: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount: number;
  total: number;
  notes: string | null;
  created_at: string;
  ordered_at: string | null;
  received_at: string | null;
  branch_id: string;
  suppliers: { name: string; phone: string | null; email: string | null } | null;
  branches: { name: string } | null;
}

interface PurchaseItemDetail {
  id: string;
  quantity: number;
  unit_cost: number;
  total: number;
  products: { name_en: string; sku: string | null } | null;
  product_variants: { name: string | null; sku: string | null } | null;
}

function fmt(n: number): string {
  return n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  ordered: "bg-blue-100 text-blue-700",
  received: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default async function PurchaseOrderDetailPage({ params }: PurchaseDetailProps) {
  const { id } = await params;
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: orderData } = await supabase
    .from("purchase_orders")
    .select(
      "id, status, subtotal, tax_amount, discount, total, notes, created_at, ordered_at, received_at, branch_id, suppliers(name, phone, email), branches(name)",
    )
    .eq("id", id)
    .maybeSingle();

  const order = orderData as PurchaseOrderDetail | null;
  if (!order) notFound();

  const { data: itemsData } = await supabase
    .from("purchase_items")
    .select(
      "id, quantity, unit_cost, total, products(name_en, sku), product_variants(name, sku)",
    )
    .eq("order_id", id);

  const items = (itemsData as PurchaseItemDetail[] | null) ?? [];

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/${locale}/purchases`}
          className="text-sm text-muted-foreground hover:text-paws-orange transition-colors"
        >
          &larr; Back to Purchases
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-900">
                PO #{order.id.slice(0, 8)}
              </h1>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Created {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {order.status === "draft" && (
              <Link href={`/${locale}/purchases/${order.id}/edit`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Pencil className="w-4 h-4" /> Edit
                </Button>
              </Link>
            )}
            <PurchaseOrderActions orderId={order.id} status={order.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <Card className="p-5 border-neutral-200 lg:col-span-2">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Supplier</h3>
          <p className="text-lg font-semibold text-neutral-900">
            {order.suppliers?.name ?? "—"}
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {order.suppliers?.phone && <span>📞 {order.suppliers.phone}</span>}
            {order.suppliers?.email && <span>✉ {order.suppliers.email}</span>}
            {order.branches?.name && <span>📍 {order.branches.name}</span>}
          </div>
        </Card>
        <Card className="p-5 border-neutral-200">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Timeline</h3>
          <dl className="text-sm space-y-1.5">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd className="text-neutral-900">{formatDate(order.created_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Ordered</dt>
              <dd className="text-neutral-900">{formatDate(order.ordered_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Received</dt>
              <dd className="text-neutral-900">{formatDate(order.received_at)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card className="border-neutral-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">SKU</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Qty</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Unit Cost</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No line items.
                  </td>
                </tr>
              ) : (
                items.map((line) => (
                  <tr key={line.id}>
                    <td className="px-4 py-3 text-neutral-900">
                      {line.products?.name_en ?? "—"}
                      {line.product_variants?.name && (
                        <span className="text-muted-foreground"> · {line.product_variants.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {line.product_variants?.sku ?? line.products?.sku ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(line.quantity)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(line.unit_cost)}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{fmt(line.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-neutral-200">
                <td colSpan={4} className="px-4 py-2 text-right text-muted-foreground">Subtotal</td>
                <td className="px-4 py-2 text-right font-mono">{fmt(order.subtotal)}</td>
              </tr>
              <tr>
                <td colSpan={4} className="px-4 py-2 text-right text-muted-foreground">Tax</td>
                <td className="px-4 py-2 text-right font-mono">{fmt(order.tax_amount)}</td>
              </tr>
              {Number(order.discount) > 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-right text-muted-foreground">Discount</td>
                  <td className="px-4 py-2 text-right font-mono">-{fmt(order.discount)}</td>
                </tr>
              )}
              <tr className="bg-neutral-50 font-bold">
                <td colSpan={4} className="px-4 py-3 text-right text-neutral-900">Total</td>
                <td className="px-4 py-3 text-right font-mono text-neutral-900">
                  {fmt(order.total)} EGP
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {order.notes && (
        <Card className="p-5 border-neutral-200">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Notes</h3>
          <p className="text-sm text-neutral-900 whitespace-pre-wrap">{order.notes}</p>
        </Card>
      )}
    </div>
  );
}
