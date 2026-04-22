"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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

const ROLES: RoleMeta[] = [
  { key: "admin", name: "Admin", description: "Full access to all features", color: "bg-red-100 text-red-700" },
  { key: "manager", name: "Manager", description: "Branch management and reporting", color: "bg-purple-100 text-purple-700" },
  { key: "cashier", name: "Cashier", description: "POS and sales operations", color: "bg-blue-100 text-blue-700" },
  { key: "warehouse", name: "Warehouse", description: "Inventory and stock management", color: "bg-amber-100 text-amber-700" },
  { key: "accountant", name: "Accountant", description: "Financial management and reports", color: "bg-emerald-100 text-emerald-700" },
  { key: "hr", name: "HR", description: "Employee and payroll management", color: "bg-pink-100 text-pink-700" },
];

const MODULES: ModuleKey[] = [
  "dashboard", "pos", "products", "inventory", "purchases",
  "sales", "customers", "accounting", "hr", "settings",
];

interface Props {
  initial: RolePermissions;
}

export function RolePermissionsMatrix({ initial }: Props) {
  const router = useRouter();
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
        setError(res.error ?? "Failed to save");
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
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground sticky left-0 bg-neutral-50">Role</th>
                {MODULES.map((m) => (
                  <th key={m} className="text-center px-3 py-3 font-semibold text-muted-foreground capitalize">
                    {m}
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
                          aria-label={`Toggle ${role.name} ${m}`}
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
