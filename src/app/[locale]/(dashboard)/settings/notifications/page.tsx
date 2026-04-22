import { Button } from "@/components/ui/button";
import { Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { NotificationSettingsEditor } from "@/components/dashboard/NotificationSettingsEditor";
import type { NotificationKey, NotificationSettings } from "@/app/[locale]/(dashboard)/settings/notifications/actions";

const KEYS: NotificationKey[] = ["new_order", "low_stock", "new_customer", "purchase_received"];

const DEFAULTS: NotificationSettings = {
  new_order: { email: true, sms: false },
  low_stock: { email: true, sms: true },
  new_customer: { email: false, sms: false },
  purchase_received: { email: true, sms: false },
};

function normalize(raw: unknown): NotificationSettings {
  const out: NotificationSettings = { ...DEFAULTS };
  if (!raw || typeof raw !== "object") return out;
  const parsed = raw as Record<string, { email?: unknown; sms?: unknown }>;
  for (const key of KEYS) {
    const source = parsed[key] ?? {};
    out[key] = {
      email: typeof source.email === "boolean" ? source.email : DEFAULTS[key].email,
      sms: typeof source.sms === "boolean" ? source.sms : DEFAULTS[key].sms,
    };
  }
  return out;
}

async function loadSettings(): Promise<NotificationSettings> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return DEFAULTS;

  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", `notification_settings:${user.id}`)
    .is("branch_id", null)
    .maybeSingle();

  const value = (data as { value: string } | null)?.value;
  if (!value) return DEFAULTS;
  try {
    return normalize(JSON.parse(value));
  } catch {
    return DEFAULTS;
  }
}

export default async function NotificationsPage() {
  const locale = await getLocale();
  const settings = await loadSettings();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/settings`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure email and SMS notification preferences</p>
        </div>
      </div>

      <NotificationSettingsEditor initial={settings} />

      <div className="mt-4 p-4 bg-neutral-50 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-paws-orange" />
          <span className="text-sm font-medium text-neutral-900">Notification Channels</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Preferences are saved per-user in <code className="font-mono">system_settings</code>.
          Email notifications use the address on your account. SMS requires a valid Egyptian mobile number in your profile.
        </p>
      </div>
    </div>
  );
}
