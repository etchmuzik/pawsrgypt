"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, Scissors, Droplets, Sparkles, Star } from "lucide-react";

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // TODO: Connect to Supabase grooming_bookings table
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-paws-orange to-paws-orange-light text-white py-16 text-center">
        <div className="text-5xl mb-4">✂️</div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{t("title")}</h1>
        <p className="text-white/90 text-lg max-w-xl mx-auto">{t("subtitle")}</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Services */}
        <h2 className="text-2xl font-bold text-paws-brown-dark mb-6 text-center">
          {t("services_title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {SERVICES.map((service) => (
            <div
              key={service.name}
              className="bg-white border border-paws-sand rounded-2xl p-6 hover:border-paws-orange hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-paws-orange/10 rounded-xl flex items-center justify-center mb-4">
                <service.icon className="w-6 h-6 text-paws-orange" />
              </div>
              <h3 className="font-bold text-paws-brown-dark mb-1">
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
          <div className="bg-white border border-paws-sand rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-paws-brown-dark mb-6 text-center">
              {t("book_appointment")}
            </h2>

            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-paws-brown-dark">
                  {t("success")}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t("name")}</Label>
                    <Input required placeholder="John Smith" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("phone")}</Label>
                    <Input required placeholder="+20 100 000 0000" type="tel" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t("pet_name")}</Label>
                    <Input required placeholder="Buddy" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("pet_type")}</Label>
                    <Input required placeholder="Dog / Cat" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t("service")}</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                      {SERVICES.map((s) => (
                        <option key={s.name} value={s.name}>
                          {locale === "ar" ? s.nameAr : s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("date")}</Label>
                    <Input required type="date" min={new Date().toISOString().split("T")[0]} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("notes")}</Label>
                  <Textarea placeholder="Any special requirements..." rows={3} />
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
