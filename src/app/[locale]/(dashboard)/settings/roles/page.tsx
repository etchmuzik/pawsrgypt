import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getLocale } from "next-intl/server";

const ROLES = [
  {
    name: "Admin",
    description: "Full access to all features",
    color: "bg-red-100 text-red-700",
    permissions: { dashboard: true, pos: true, products: true, inventory: true, purchases: true, sales: true, customers: true, accounting: true, hr: true, settings: true },
  },
  {
    name: "Manager",
    description: "Branch management and reporting",
    color: "bg-purple-100 text-purple-700",
    permissions: { dashboard: true, pos: true, products: true, inventory: true, purchases: true, sales: true, customers: true, accounting: true, hr: false, settings: false },
  },
  {
    name: "Cashier",
    description: "POS and sales operations",
    color: "bg-blue-100 text-blue-700",
    permissions: { dashboard: true, pos: true, products: false, inventory: false, purchases: false, sales: true, customers: true, accounting: false, hr: false, settings: false },
  },
  {
    name: "Warehouse",
    description: "Inventory and stock management",
    color: "bg-amber-100 text-amber-700",
    permissions: { dashboard: true, pos: false, products: true, inventory: true, purchases: true, sales: false, customers: false, accounting: false, hr: false, settings: false },
  },
  {
    name: "Accountant",
    description: "Financial management and reports",
    color: "bg-emerald-100 text-emerald-700",
    permissions: { dashboard: true, pos: false, products: false, inventory: false, purchases: true, sales: true, customers: false, accounting: true, hr: false, settings: false },
  },
  {
    name: "HR",
    description: "Employee and payroll management",
    color: "bg-pink-100 text-pink-700",
    permissions: { dashboard: true, pos: false, products: false, inventory: false, purchases: false, sales: false, customers: false, accounting: false, hr: true, settings: false },
  },
];

const MODULES = ["dashboard", "pos", "products", "inventory", "purchases", "sales", "customers", "accounting", "hr", "settings"] as const;

export default async function RolesPage() {
  const locale = await getLocale();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/settings`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure role-based access control</p>
        </div>
      </div>

      <Card className="border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground sticky left-0 bg-neutral-50">Role</th>
                {MODULES.map((m) => (
                  <th key={m} className="text-center px-3 py-3 font-semibold text-muted-foreground capitalize">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {ROLES.map((role) => (
                <tr key={role.name} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`${role.color} hover:${role.color}`}>
                        {role.name}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                  </td>
                  {MODULES.map((m) => (
                    <td key={m} className="text-center px-3 py-3">
                      {role.permissions[m] ? (
                        <Check className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-neutral-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 p-4 bg-neutral-50 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-paws-orange" />
          <span className="text-sm font-medium text-neutral-900">Role-Based Access</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Permissions are enforced through middleware. Users can only access modules assigned to their role.
          To change a user&apos;s role, go to Settings &rarr; Users.
        </p>
      </div>
    </div>
  );
}
