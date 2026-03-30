import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import type { Customer } from "@/lib/supabase/types";
import Link from "next/link";

interface CustomersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CustomersPage({ params }: CustomersPageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-paws-brown-dark">Customers</h1>
        <Link href={`/${locale}/customers/new`}>
          <Button size="sm" className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white">
            <Plus className="w-4 h-4" /> Add Customer
          </Button>
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search customers..." className="ps-9 bg-white border-paws-sand max-w-sm" />
      </div>

      <div className="bg-white rounded-2xl border border-paws-sand overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-paws-sand bg-paws-cream/50">
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Name</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Phone</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Balance</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Credit Limit</th>
              <th className="text-start px-4 py-3 font-semibold text-paws-brown">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!customers || customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No customers yet.
                </td>
              </tr>
            ) : (
              (customers as Customer[]).map((c) => (
                <tr key={c.id} className="border-b border-paws-sand/50 hover:bg-paws-cream/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3">{c.balance} EGP</td>
                  <td className="px-4 py-3">{c.credit_limit} EGP</td>
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
