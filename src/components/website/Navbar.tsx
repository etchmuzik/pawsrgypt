"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Menu, X, Globe, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart";
import { PawLogo } from "@/components/website/PawLogo";

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const otherLocale = locale === "en" ? "ar" : "en";
  const otherLocalePath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  const navLinks = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/shop`, label: t("shop") },
    { href: `/${locale}/about`, label: t("about") },
    { href: `/${locale}/blog`, label: t("blog") },
    { href: `/${locale}/dashboard`, label: t("dashboard") },
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md border-b border-neutral-100 shadow-sm" : "bg-transparent border-b border-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center">
            <PawLogo />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-neutral-600 hover:text-paws-orange transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(otherLocalePath)}
              className="hidden md:flex gap-1.5 text-neutral-600 hover:text-paws-orange"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">
                {otherLocale === "ar" ? "عربي" : "EN"}
              </span>
            </Button>

            {/* Cart */}
            <Link href={`/${locale}/cart`} aria-label={t("cart")}>
              <Button
                variant="ghost"
                size="sm"
                className="relative text-neutral-600 hover:text-paws-orange min-h-11 min-w-11"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 end-1 bg-paws-orange text-white text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center font-bold leading-none">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile Menu */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-neutral-600 min-h-11 min-w-11"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-neutral-100 px-4 py-2 space-y-1 shadow-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-base font-medium text-neutral-700 hover:text-paws-orange active:bg-neutral-50 py-3 px-2 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => {
              setMobileOpen(false);
              router.push(otherLocalePath);
            }}
            className="flex items-center gap-2 w-full text-base font-medium text-neutral-700 hover:text-paws-orange active:bg-neutral-50 py-3 px-2 rounded-lg"
          >
            <Globe className="w-4 h-4" />
            {otherLocale === "ar" ? "عربي" : "English"}
          </button>
        </div>
      )}
    </header>
  );
}
