import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import type { Supplier } from "@/lib/supabase/types";
import Link from "next/link";

interface SuppliersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SuppliersPage({ params }: SuppliersPageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-paws-brown-dark">Suppliers</h1>
        <Link href={`/${locale}/purchases/suppliers/new`}>
          <Button
            size="sm"
            className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white"
          >
            <Plus className="w-4 h-4" /> Add Supplier
          </Button>
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search suppliers..."
          className="ps-9 bg-white border-paws-sand max-w-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-paws-sand overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-paws-sand bg-paws-cream/50">
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">
                Name
              </th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">
                Phone
              </th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">
                Email
              </th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">
                Balance
              </th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">
                Status
              </th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {!suppliers || suppliers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No suppliers yet. Add your first supplier.
                </td>
              </tr>
            ) : (
              (suppliers as Supplier[]).map((supplier) => (
                <tr
                  key={supplier.id}
                  className="border-b border-paws-sand/50 hover:bg-paws-cream/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-paws-brown-dark">
                    {supplier.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {supplier.phone ?? "---"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {supplier.email ?? "---"}
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {supplier.balance} EGP
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={supplier.is_active ? "default" : "secondary"}
                      className={
                        supplier.is_active
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : ""
                      }
                    >
                      {supplier.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                    >
                      Edit
                    </Button>
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
