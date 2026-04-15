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
            <Link href={`/${locale}/cart`}>
              <Button
                variant="ghost"
                size="sm"
                className="relative text-neutral-600 hover:text-paws-orange"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-paws-orange text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile Menu */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-neutral-600"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-neutral-100 px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm font-medium text-neutral-600 hover:text-paws-orange py-1"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => router.push(otherLocalePath)}
            className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-paws-orange py-1"
          >
            <Globe className="w-4 h-4" />
            {otherLocale === "ar" ? "عربي" : "EN"}
          </button>
        </div>
      )}
    </header>
  );
}
