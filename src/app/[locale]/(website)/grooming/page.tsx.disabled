"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, Scissors, Droplets, Sparkles, Star, ScissorsLineDashed } from "lucide-react";

const SERVICES = [
  {
    icon: Scissors,
    name: "Full Grooming",
    nameAr: "تجميل كامل",
    desc: "Bath, dry, trim & style",
    descAr: "حمام، تجفيف، تقليم وتصفيف",
    price: "250",
    duration: "2-3 hours",
  },
  {
    icon: Droplets,
    name: "Bath & Dry",
    nameAr: "حمام وتجفيف",
    desc: "Thorough wash and blow dry",
    descAr: "غسيل شامل وتجفيف",
    price: "150",
    duration: "1-2 hours",
  },
  {
    icon: Sparkles,
    name: "Nail Trim",
    nameAr: "قص الأظافر",
    desc: "Safe nail trimming",
    descAr: "قص آمن للأظافر",
    price: "60",
    duration: "30 min",
  },
  {
    icon: Star,
    name: "Teeth Cleaning",
    nameAr: "تنظيف الأسنان",
    desc: "Professional dental hygiene",
    descAr: "عناية احترافية بالأسنان",
    price: "90",
    duration: "45 min",
  },
];

export default function GroomingPage() {
  const t = useTranslations("grooming");
  const locale = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error } = await supabase.from("grooming_bookings").insert({
        customer_name: formData.get("customer_name") as string,
        phone: formData.get("phone") as string,
        pet_name: formData.get("pet_name") as string,
        pet_type: formData.get("pet_type") as string,
        service: formData.get("service") as string,
        preferred_date: formData.get("preferred_date") as string,
        notes: (formData.get("notes") as string) || null,
        status: "pending",
      } as never);

      if (error) throw error;
      setSubmitted(true);
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-paws-orange to-paws-orange-light text-white py-16 text-center">
        <ScissorsLineDashed className="w-12 h-12 text-white/90 mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{t("title")}</h1>
        <p className="text-white/90 text-lg max-w-xl mx-auto">{t("subtitle")}</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Services */}
        <h2 className="text-2xl font-bold text-neutral-900 mb-6 text-center">
          {t("services_title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {SERVICES.map((service) => (
            <div
              key={service.name}
              className="bg-white border border-neutral-200 rounded-2xl p-6 hover:border-paws-orange hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-paws-orange/10 rounded-xl flex items-center justify-center mb-4">
                <service.icon className="w-6 h-6 text-paws-orange" />
              </div>
              <h3 className="font-bold text-neutral-900 mb-1">
                {locale === "ar" ? service.nameAr : service.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {locale === "ar" ? service.descAr : service.desc}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-paws-orange font-bold">
                  {t("price_from")} {service.price} EGP
                </span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {service.duration}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Booking Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-neutral-200 rounded-3xl p-4 sm:p-6 md:p-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6 text-center">
              {t("book_appointment")}
            </h2>

            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-neutral-900">
                  {t("success")}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm rounded-lg px-3 py-2">
                    <span>{errorMessage}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t("name")}</Label>
                    <Input name="customer_name" required placeholder="John Smith" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("phone")}</Label>
                    <Input name="phone" required placeholder="+20 100 000 0000" type="tel" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t("pet_name")}</Label>
                    <Input name="pet_name" required placeholder="Buddy" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("pet_type")}</Label>
                    <Input name="pet_type" required placeholder="Dog / Cat" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t("service")}</Label>
                    <select name="service" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                      {SERVICES.map((s) => (
                        <option key={s.name} value={s.name}>
                          {locale === "ar" ? s.nameAr : s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("date")}</Label>
                    <Input name="preferred_date" required type="date" min={new Date().toISOString().split("T")[0]} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("notes")}</Label>
                  <Textarea name="notes" placeholder="Any special requirements..." rows={3} />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-paws-orange hover:bg-paws-orange/90 text-white"
                  disabled={loading}
                >
                  {loading ? "..." : t("submit")}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
