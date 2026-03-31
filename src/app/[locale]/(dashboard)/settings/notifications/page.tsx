"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Mail, MessageSquare, ArrowLeft, ShoppingCart, Package, Users, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  email: boolean;
  sms: boolean;
}

export default function NotificationsPage() {
  const locale = useLocale();

  const [settings, setSettings] = useState<NotificationSetting[]>([
    { id: "new_order", label: "New Order", description: "When a new sales order is created", icon: ShoppingCart, email: true, sms: false },
    { id: "low_stock", label: "Low Stock Alert", description: "When product stock falls below minimum", icon: AlertTriangle, email: true, sms: true },
    { id: "new_customer", label: "New Customer", description: "When a new customer registers", icon: Users, email: false, sms: false },
    { id: "purchase_received", label: "Purchase Received", description: "When a purchase order is received", icon: Package, email: true, sms: false },
  ]);

  function toggleSetting(id: string, channel: "email" | "sms") {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [channel]: !s[channel] } : s))
    );
  }

  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/settings`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure email and SMS notification preferences</p>
        </div>
        <Button
          onClick={handleSave}
          className="bg-paws-orange hover:bg-paws-orange/90 text-white"
        >
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      <Card className="border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center">
          <span className="flex-1 text-sm font-semibold text-muted-foreground">Notification</span>
          <div className="flex gap-8">
            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
              <Mail className="w-4 h-4" /> Email
            </span>
            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
              <MessageSquare className="w-4 h-4" /> SMS
            </span>
          </div>
        </div>
        <div className="divide-y divide-neutral-100">
          {settings.map((setting) => (
            <div key={setting.id} className="px-4 py-4 flex items-center hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 bg-neutral-100 rounded-xl flex items-center justify-center">
                  <setting.icon className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{setting.label}</p>
                  <p className="text-xs text-muted-foreground">{setting.description}</p>
                </div>
              </div>
              <div className="flex gap-8">
                <div className="w-16 flex justify-center">
                  <button
                    onClick={() => toggleSetting(setting.id, "email")}
                    className={`w-10 h-6 rounded-full transition-colors relative ${setting.email ? "bg-paws-orange" : "bg-neutral-200"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${setting.email ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                </div>
                <div className="w-16 flex justify-center">
                  <button
                    onClick={() => toggleSetting(setting.id, "sms")}
                    className={`w-10 h-6 rounded-full transition-colors relative ${setting.sms ? "bg-paws-orange" : "bg-neutral-200"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${setting.sms ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 p-4 bg-neutral-50 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-paws-orange" />
          <span className="text-sm font-medium text-neutral-900">Notification Channels</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Email notifications are sent to the address associated with your account.
          SMS notifications require a valid Egyptian mobile number in your profile.
        </p>
      </div>
    </div>
  );
}
