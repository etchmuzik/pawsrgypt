import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { RolePermissionsMatrix } from "@/components/dashboard/RolePermissionsMatrix";
import type {
  ModuleKey,
  RoleKey,
  RolePermissions,
} from "@/app/[locale]/(dashboard)/settings/roles/actions";

const ROLE_KEYS: RoleKey[] = ["admin", "manager", "cashier", "warehouse", "accountant", "hr"];
const MODULE_KEYS: ModuleKey[] = [
  "dashboard", "pos", "products", "inventory", "purchases",
  "sales", "customers", "accounting", "hr", "settings",
];

const DEFAULT_PERMISSIONS: RolePermissions = {
  admin: { dashboard: true, pos: true, products: true, inventory: true, purchases: true, sales: true, customers: true, accounting: true, hr: true, settings: true },
  manager: { dashboard: true, pos: true, products: true, inventory: true, purchases: true, sales: true, customers: true, accounting: true, hr: false, settings: false },
  cashier: { dashboard: true, pos: true, products: false, inventory: false, purchases: false, sales: true, customers: true, accounting: false, hr: false, settings: false },
  warehouse: { dashboard: true, pos: false, products: true, inventory: true, purchases: true, sales: false, customers: false, accounting: false, hr: false, settings: false },
  accountant: { dashboard: true, pos: false, products: false, inventory: false, purchases: true, sales: true, customers: false, accounting: true, hr: false, settings: false },
  hr: { dashboard: true, pos: false, products: false, inventory: false, purchases: false, sales: false, customers: false, accounting: false, hr: true, settings: false },
};

function normalize(raw: unknown): RolePermissions {
  const out: RolePermissions = { ...DEFAULT_PERMISSIONS };
  if (!raw || typeof raw !== "object") return out;
  const parsed = raw as Record<string, Record<string, boolean>>;
  for (const role of ROLE_KEYS) {
    const source = parsed[role] ?? {};
    const merged: Record<ModuleKey, boolean> = { ...DEFAULT_PERMISSIONS[role] };
    for (const mod of MODULE_KEYS) {
      if (typeof source[mod] === "boolean") merged[mod] = source[mod];
    }
    out[role] = merged;
  }
  return out;
}

async function loadPermissions(): Promise<RolePermissions> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "role_permissions")
    .is("branch_id", null)
    .maybeSingle();
  const value = (data as { value: string } | null)?.value;
  if (!value) return DEFAULT_PERMISSIONS;
  try {
    return normalize(JSON.parse(value));
  } catch {
    return DEFAULT_PERMISSIONS;
  }
}

export default async function RolesPage() {
  const locale = await getLocale();
  const permissions = await loadPermissions();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/settings`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Roles &amp; Permissions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Toggle module access per role</p>
        </div>
      </div>

      <RolePermissionsMatrix initial={permissions} />

      <div className="mt-4 p-4 bg-neutral-50 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-paws-orange" />
          <span className="text-sm font-medium text-neutral-900">Role-Based Access</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Permissions are stored in <code className="font-mono">system_settings.role_permissions</code> and used by
          middleware to guard module access. Change a user&apos;s role via Settings &rarr; Users.
        </p>
      </div>
    </div>
  );
}
