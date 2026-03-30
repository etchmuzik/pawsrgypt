"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  ShoppingBag,
  Users,
  Calculator,
  UserCheck,
  Settings,
  LogOut,
  ChevronRight,
  Monitor,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", labelAr: "لوحة التحكم", href: "/dashboard" },
  { icon: Monitor, label: "POS", labelAr: "نقطة البيع", href: "/pos" },
  { icon: Package, label: "Products", labelAr: "المنتجات", href: "/products" },
  { icon: Warehouse, label: "Inventory", labelAr: "المخزون", href: "/inventory" },
  { icon: ShoppingBag, label: "Purchases", labelAr: "المشتريات", href: "/purchases" },
  { icon: ShoppingCart, label: "Sales", labelAr: "المبيعات", href: "/sales" },
  { icon: Users, label: "Customers", labelAr: "العملاء", href: "/customers" },
  { icon: Calculator, label: "Accounting", labelAr: "المحاسبة", href: "/accounting" },
  { icon: UserCheck, label: "HR", labelAr: "الموارد البشرية", href: "/hr" },
  { icon: Settings, label: "Settings", labelAr: "الإعدادات", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  }

  return (
    <aside className="w-60 bg-sidebar text-sidebar-foreground flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-5 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 bg-paws-orange rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">P</span>
        </div>
        <div>
          <p className="font-bold text-sm text-white">PAWS Egypt</p>
          <p className="text-xs text-sidebar-foreground/60">Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const fullHref = `/${locale}${item.href}`;
            const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`);

            return (
              <li key={item.href}>
                <Link
                  href={fullHref}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">
                    {locale === "ar" ? item.labelAr : item.label}
                  </span>
                  {isActive && <ChevronRight className="w-3 h-3" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-sidebar-border shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
