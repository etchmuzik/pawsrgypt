import { createClient } from "@/lib/supabase/server";
import { PurchaseOrderEditForm } from "@/components/dashboard/PurchaseOrderEditForm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getLocale } from "next-intl/server";

interface EditPageProps {
  params: Promise<{ id: string; locale: string }>;
}

interface OrderRow {
  id: string;
  status: string;
  supplier_id: string;
  branch_id: string;
  notes: string | null;
  discount: number;
  subtotal: number;
  tax_amount: number;
}

interface ItemRow {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_cost: number;
}

interface SupplierOption {
  id: string;
  name: string;
}

interface BranchOption {
  id: string;
  name: string;
}

interface ProductOption {
  id: string;
  sku: string | null;
  name_en: string;
  cost_price: number | null;
}

export default async function EditPurchaseOrderPage({ params }: EditPageProps) {
  const { id, locale } = await params;
  const _locale = await getLocale();
  const effectiveLocale = locale || _locale;
  const supabase = await createClient();

  const { data: orderData } = await supabase
    .from("purchase_orders")
    .select("id, status, supplier_id, branch_id, notes, discount, subtotal, tax_amount")
    .eq("id", id)
    .maybeSingle();

  const order = orderData as OrderRow | null;
  if (!order) notFound();
  if (order.status !== "draft") {
    redirect(`/${effectiveLocale}/purchases/${id}`);
  }

  const [{ data: itemsData }, { data: suppliersData }, { data: branchesData }, { data: productsData }] = await Promise.all([
    supabase.from("purchase_items").select("product_id, variant_id, quantity, unit_cost").eq("order_id", id),
    supabase.from("suppliers").select("id, name").eq("is_active", true).order("name"),
    supabase.from("branches").select("id, name").eq("is_active", true).order("name"),
    supabase.from("products").select("id, sku, name_en, cost_price").eq("is_active", true).order("name_en").limit(500),
  ]);

  return (
    <div className="max-w-5xl">
      <Link
        href={`/${effectiveLocale}/purchases/${id}`}
        className="text-sm text-muted-foreground hover:text-paws-orange"
      >
        &larr; Back to Purchase Order
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900 mt-2 mb-6">Edit Purchase Order</h1>
      <PurchaseOrderEditForm
        initial={{
          id: order.id,
          supplier_id: order.supplier_id,
          branch_id: order.branch_id,
          notes: order.notes,
          discount: Number(order.discount) || 0,
          subtotal: Number(order.subtotal) || 0,
          tax_amount: Number(order.tax_amount) || 0,
          items: ((itemsData as ItemRow[]) ?? []).map((i) => ({
            product_id: i.product_id,
            variant_id: i.variant_id,
            quantity: Number(i.quantity),
            unit_cost: Number(i.unit_cost),
          })),
        }}
        suppliers={(suppliersData as SupplierOption[]) ?? []}
        branches={(branchesData as BranchOption[]) ?? []}
        products={(productsData as ProductOption[]) ?? []}
      />
    </div>
  );
}
