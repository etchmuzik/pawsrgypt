"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";
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
  FileText,
  Menu,
  X,
  Globe,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", labelAr: "لوحة التحكم", href: "/dashboard" },
  { icon: Monitor, label: "POS", labelAr: "نقطة البيع", href: "/pos" },
  { icon: Package, label: "Products", labelAr: "المنتجات", href: "/products" },
  { icon: FileText, label: "Blog", labelAr: "المدونة", href: "/dashboard/blog" },
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
  const otherLocale = locale === "ar" ? "en" : "ar";
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-5 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 bg-paws-orange rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">P</span>
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm text-white">PAWS Egypt</p>
          <p className="text-xs text-sidebar-foreground/60">
            {locale === "ar" ? "لوحة الإدارة" : "Management"}
          </p>
        </div>
        {/* Close button on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden w-8 h-8 flex items-center justify-center text-sidebar-foreground/80 hover:text-white"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
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
                  onClick={() => setMobileOpen(false)}
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

      {/* Language switcher + Logout */}
      <div className="p-3 border-t border-sidebar-border shrink-0 space-y-1">
        <Link
          href={`/${otherLocale}${pathname.replace(`/${locale}`, "") || ""}`}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>{locale === "ar" ? "English" : "العربية"}</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{locale === "ar" ? "تسجيل الخروج" : "Logout"}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 w-10 h-10 bg-sidebar text-white rounded-xl flex items-center justify-center shadow-lg"
        aria-label="Open menu"
        aria-expanded={mobileOpen}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-out sidebar */}
      <aside
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? true : undefined}
        aria-hidden={!mobileOpen}
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-sidebar text-sidebar-foreground flex-col h-full">
        {sidebarContent}
      </aside>
    </>
  );
}
