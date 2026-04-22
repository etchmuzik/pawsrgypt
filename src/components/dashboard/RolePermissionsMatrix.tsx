"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  saveRolePermissions,
  type ModuleKey,
  type RoleKey,
  type RolePermissions,
} from "@/app/[locale]/(dashboard)/settings/roles/actions";

interface RoleMeta {
  key: RoleKey;
  name: string;
  description: string;
  color: string;
}

interface RoleI18n { name: string; description: string; }
function buildRoles(locale: string): RoleMeta[] {
  const isAr = locale === "ar";
  const dict: Record<RoleKey, RoleI18n> = isAr
    ? {
        admin: { name: "مدير", description: "صلاحية كاملة لكل المميزات" },
        manager: { name: "مدير فرع", description: "إدارة الفرع والتقارير" },
        cashier: { name: "كاشير", description: "نقطة البيع والمبيعات" },
        warehouse: { name: "مخزن", description: "المخزون والحركة" },
        accountant: { name: "محاسب", description: "المالية والتقارير" },
        hr: { name: "موارد بشرية", description: "الموظفين والرواتب" },
      }
    : {
        admin: { name: "Admin", description: "Full access to all features" },
        manager: { name: "Manager", description: "Branch management and reporting" },
        cashier: { name: "Cashier", description: "POS and sales operations" },
        warehouse: { name: "Warehouse", description: "Inventory and stock management" },
        accountant: { name: "Accountant", description: "Financial management and reports" },
        hr: { name: "HR", description: "Employee and payroll management" },
      };
  const colors: Record<RoleKey, string> = {
    admin: "bg-red-100 text-red-700",
    manager: "bg-purple-100 text-purple-700",
    cashier: "bg-blue-100 text-blue-700",
    warehouse: "bg-amber-100 text-amber-700",
    accountant: "bg-emerald-100 text-emerald-700",
    hr: "bg-pink-100 text-pink-700",
  };
  return (Object.keys(dict) as RoleKey[]).map((k) => ({
    key: k,
    name: dict[k].name,
    description: dict[k].description,
    color: colors[k],
  }));
}

const MODULES: ModuleKey[] = [
  "dashboard", "pos", "products", "inventory", "purchases",
  "sales", "customers", "accounting", "hr", "settings",
];

interface Props {
  initial: RolePermissions;
}

export function RolePermissionsMatrix({ initial }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const ROLES = buildRoles(locale);
  const MODULE_LABELS: Record<ModuleKey, string> = locale === "ar"
    ? {
        dashboard: "الرئيسية",
        pos: "نقطة البيع",
        products: "المنتجات",
        inventory: "المخزون",
        purchases: "المشتريات",
        sales: "المبيعات",
        customers: "العملاء",
        accounting: "المحاسبة",
        hr: "الموارد البشرية",
        settings: "الإعدادات",
      }
    : {
        dashboard: "Dashboard",
        pos: "POS",
        products: "Products",
        inventory: "Inventory",
        purchases: "Purchases",
        sales: "Sales",
        customers: "Customers",
        accounting: "Accounting",
        hr: "HR",
        settings: "Settings",
      };
  const roleCol = locale === "ar" ? "الصلاحية" : "Role";
  const failedLbl = locale === "ar" ? "فشل الحفظ" : "Failed to save";
  const savedLbl = locale === "ar" ? "تم الحفظ!" : "Saved!";
  const saveLbl = locale === "ar" ? "حفظ التغييرات" : "Save Changes";
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [permissions, setPermissions] = useState<RolePermissions>(initial);

  function toggle(role: RoleKey, module: ModuleKey) {
    setPermissions((prev) => ({
      ...prev,
      [role]: { ...prev[role], [module]: !prev[role][module] },
    }));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await saveRolePermissions(permissions);
      if (!res.success) {
        setError(res.error ?? failedLbl);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2 mb-4">
        {error && <span className="text-sm text-red-600">{error}</span>}
        <Button
          onClick={handleSave}
          disabled={pending}
          className="bg-paws-orange hover:bg-paws-orange/90 text-white"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {saved ? savedLbl : saveLbl}
        </Button>
      </div>

      <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground sticky left-0 bg-neutral-50">{roleCol}</th>
                {MODULES.map((m) => (
                  <th key={m} className="text-center px-3 py-3 font-semibold text-muted-foreground">
                    {MODULE_LABELS[m]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {ROLES.map((role) => (
                <tr key={role.key} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={role.color}>
                        {role.name}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                  </td>
                  {MODULES.map((m) => {
                    const on = permissions[role.key]?.[m] ?? false;
                    return (
                      <td key={m} className="text-center px-3 py-3">
                        <button
                          type="button"
                          onClick={() => toggle(role.key, m)}
                          className="p-1 rounded hover:bg-neutral-100 transition-colors"
                          aria-label={`${role.name} · ${MODULE_LABELS[m]}`}
                        >
                          {on ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-neutral-300" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
