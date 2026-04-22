"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, ShoppingCart, Package, Users, AlertTriangle, Loader2 } from "lucide-react";
import {
  saveNotificationSettings,
  type NotificationKey,
  type NotificationSettings,
} from "@/app/[locale]/(dashboard)/settings/notifications/actions";

interface Row {
  id: NotificationKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

function buildRows(locale: string): Row[] {
  const isAr = locale === "ar";
  return [
    { id: "new_order", label: isAr ? "طلب جديد" : "New Order", description: isAr ? "لما يتعمل طلب مبيعات جديد" : "When a new sales order is created", icon: ShoppingCart },
    { id: "low_stock", label: isAr ? "تنبيه مخزون قليل" : "Low Stock Alert", description: isAr ? "لما المخزون يقل عن الحد الأدنى" : "When product stock falls below minimum", icon: AlertTriangle },
    { id: "new_customer", label: isAr ? "عميل جديد" : "New Customer", description: isAr ? "لما يتسجل عميل جديد" : "When a new customer registers", icon: Users },
    { id: "purchase_received", label: isAr ? "استلام مشتريات" : "Purchase Received", description: isAr ? "لما يتم استلام أمر شراء" : "When a purchase order is received", icon: Package },
  ];
}

interface Props {
  initial: NotificationSettings;
}

export function NotificationSettingsEditor({ initial }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const ROWS = buildRows(locale);
  const L = {
    notification: locale === "ar" ? "الإشعار" : "Notification",
    email: locale === "ar" ? "إيميل" : "Email",
    sms: locale === "ar" ? "رسالة" : "SMS",
    toggleEmail: (label: string) => locale === "ar" ? `تفعيل إيميل لـ ${label}` : `Toggle email for ${label}`,
    toggleSms: (label: string) => locale === "ar" ? `تفعيل SMS لـ ${label}` : `Toggle SMS for ${label}`,
    saved: locale === "ar" ? "تم الحفظ!" : "Saved!",
    save: locale === "ar" ? "حفظ التغييرات" : "Save Changes",
    failed: locale === "ar" ? "فشل الحفظ" : "Failed to save",
  };
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(initial);

  function toggle(id: NotificationKey, channel: "email" | "sms") {
    setSettings((prev) => ({
      ...prev,
      [id]: { ...prev[id], [channel]: !prev[id][channel] },
    }));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await saveNotificationSettings(settings);
      if (!res.success) {
        setError(res.error ?? L.failed);
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
          {saved ? L.saved : L.save}
        </Button>
      </div>

      <Card className="border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center">
          <span className="flex-1 text-sm font-semibold text-muted-foreground">{L.notification}</span>
          <div className="flex gap-8">
            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
              <Mail className="w-4 h-4" /> {L.email}
            </span>
            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
              <MessageSquare className="w-4 h-4" /> {L.sms}
            </span>
          </div>
        </div>
        <div className="divide-y divide-neutral-100">
          {ROWS.map((row) => {
            const Icon = row.icon;
            const emailOn = settings[row.id]?.email ?? false;
            const smsOn = settings[row.id]?.sms ?? false;
            return (
              <div key={row.id} className="px-4 py-4 flex items-center hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{row.label}</p>
                    <p className="text-xs text-muted-foreground">{row.description}</p>
                  </div>
                </div>
                <div className="flex gap-8">
                  <div className="w-16 flex justify-center">
                    <button
                      type="button"
                      onClick={() => toggle(row.id, "email")}
                      className={`w-10 h-6 rounded-full transition-colors relative ${emailOn ? "bg-paws-orange" : "bg-neutral-200"}`}
                      aria-label={L.toggleEmail(row.label)}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${emailOn ? "left-[18px]" : "left-0.5"}`} />
                    </button>
                  </div>
                  <div className="w-16 flex justify-center">
                    <button
                      type="button"
                      onClick={() => toggle(row.id, "sms")}
                      className={`w-10 h-6 rounded-full transition-colors relative ${smsOn ? "bg-paws-orange" : "bg-neutral-200"}`}
                      aria-label={L.toggleSms(row.label)}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${smsOn ? "left-[18px]" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
