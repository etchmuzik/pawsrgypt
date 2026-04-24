"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Bell, Loader2, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NotifyWhenAvailableProps {
  productId: string;
  variantId?: string | null;
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function NotifyWhenAvailable({
  productId,
  variantId = null,
  size = "lg",
  className = "",
}: NotifyWhenAvailableProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const L = {
    outOfStockCta: isAr ? "نبهني لما يتوفر" : "Notify me when available",
    title: isAr ? "اتبلّغ لما يرجع للمخزن" : "Get notified when it's back",
    desc: isAr
      ? "سيب إيميلك و (اختياري) موبايلك، وهنبعتلك رسالة أول ما المنتج يتوفر تاني."
      : "Leave your email and (optionally) your phone. We'll ping you the moment it's available again.",
    email: isAr ? "الإيميل" : "Email",
    phone: isAr ? "الموبايل (اختياري)" : "Phone (optional)",
    submit: isAr ? "سجّلني" : "Notify me",
    sending: isAr ? "جاري الحفظ..." : "Saving...",
    done: isAr ? "تمام! هنتواصل معاك قريب." : "Done! We'll reach out when it's back.",
    close: isAr ? "إغلاق" : "Close",
    failed: isAr ? "حصل خطأ، حاول تاني." : "Something went wrong, try again.",
    invalidEmail: isAr ? "إيميل مش صحيح." : "Please enter a valid email.",
  };

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function reset() {
    setEmail("");
    setPhone("");
    setError(null);
    setSuccess(false);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(L.invalidEmail);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stock-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variantId,
          email: email.trim(),
          phone: phone.trim() || null,
        }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!body.ok) {
        setError(body.error ?? L.failed);
        return;
      }
      setSuccess(true);
    } catch {
      setError(L.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        size={size}
        variant="outline"
        className={`gap-2 border-paws-orange text-paws-orange hover:bg-paws-orange hover:text-white ${className}`}
      >
        <Bell className="w-5 h-5" />
        {L.outOfStockCta}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => {
            setOpen(false);
            if (success) reset();
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 border border-paws-sand"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">{L.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{L.desc}</p>
              </div>
              <button
                type="button"
                aria-label={L.close}
                onClick={() => {
                  setOpen(false);
                  if (success) reset();
                }}
                className="text-muted-foreground hover:text-neutral-900 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center text-center py-6 gap-3">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <p className="font-semibold text-neutral-900">{L.done}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                >
                  {L.close}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label htmlFor="notify-email">{L.email} *</Label>
                  <Input
                    id="notify-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="notify-phone">{L.phone}</Label>
                  <Input
                    id="notify-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-paws-orange hover:bg-paws-orange/90 text-white gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? L.sending : L.submit}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
