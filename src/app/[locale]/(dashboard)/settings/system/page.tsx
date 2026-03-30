import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, ArrowLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import type { SystemSettings } from "@/lib/supabase/types";

interface SettingsByCategory {
  [category: string]: SystemSettings[];
}

const CATEGORY_LABELS: Record<string, { label: string; description: string }> = {
  general: { label: "General", description: "Basic application settings" },
  tax: { label: "Tax & Pricing", description: "Tax rates and pricing rules" },
  invoice: { label: "Invoicing", description: "Invoice format and defaults" },
  notification: { label: "Notifications", description: "Alert and messaging preferences" },
  pos: { label: "Point of Sale", description: "POS terminal configuration" },
  inventory: { label: "Inventory", description: "Stock and warehouse rules" },
  hr: { label: "Human Resources", description: "Employee and payroll settings" },
  other: { label: "Other", description: "Miscellaneous settings" },
};

const DEFAULT_SETTINGS: Array<{ key: string; category: string; description: string }> = [
  { key: "company_name", category: "general", description: "Your company display name" },
  { key: "default_currency", category: "general", description: "Default currency code (e.g. EGP)" },
  { key: "default_language", category: "general", description: "Default app language (en/ar)" },
  { key: "tax_rate", category: "tax", description: "Default tax percentage" },
  { key: "tax_inclusive", category: "tax", description: "Whether prices include tax by default" },
  { key: "invoice_prefix", category: "invoice", description: "Prefix for invoice numbers (e.g. INV-)" },
  { key: "invoice_next_number", category: "invoice", description: "Next invoice sequence number" },
  { key: "low_stock_threshold", category: "inventory", description: "Alert when stock falls below this level" },
  { key: "pos_receipt_footer", category: "pos", description: "Custom text on POS receipts" },
  { key: "sms_notifications", category: "notification", description: "Enable SMS notifications" },
  { key: "email_notifications", category: "notification", description: "Enable email notifications" },
];

function categorizeKey(key: string): string {
  if (key.startsWith("tax") || key.startsWith("pricing")) return "tax";
  if (key.startsWith("invoice")) return "invoice";
  if (key.startsWith("notification") || key.startsWith("sms") || key.startsWith("email")) return "notification";
  if (key.startsWith("pos") || key.startsWith("receipt")) return "pos";
  if (key.startsWith("inventory") || key.startsWith("stock") || key.startsWith("low_stock")) return "inventory";
  if (key.startsWith("hr") || key.startsWith("payroll") || key.startsWith("employee")) return "hr";
  if (key.startsWith("company") || key.startsWith("default") || key.startsWith("currency") || key.startsWith("language")) return "general";
  return "other";
}

function formatSettingKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function getSettings(): Promise<SystemSettings[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("system_settings")
    .select("*")
    .order("key");
  return (data as SystemSettings[]) ?? [];
}

export default async function SystemSettingsPage() {
  const settings = await getSettings();

  const grouped: SettingsByCategory = {};
  for (const setting of settings) {
    const category = categorizeKey(setting.key);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(setting);
  }

  const categoryOrder = ["general", "tax", "invoice", "pos", "inventory", "notification", "hr", "other"];
  const sortedCategories = categoryOrder.filter((cat) => grouped[cat]?.length);

  const hasSettings = settings.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-paws-brown-dark">System Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure application-wide settings
          </p>
        </div>
      </div>

      {hasSettings ? (
        /* Existing Settings Grouped by Category */
        <div className="space-y-6">
          {sortedCategories.map((category) => {
            const categoryInfo = CATEGORY_LABELS[category] ?? {
              label: formatSettingKey(category),
              description: "",
            };
            const categorySettings = grouped[category];

            return (
              <Card key={category} className="border-paws-sand">
                <CardContent className="pt-2">
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-paws-sand/50">
                    <div className="w-8 h-8 bg-paws-cream rounded-lg flex items-center justify-center">
                      <Settings className="w-4 h-4 text-paws-brown" />
                    </div>
                    <div>
                      <h2 className="font-bold text-paws-brown-dark">{categoryInfo.label}</h2>
                      {categoryInfo.description && (
                        <p className="text-xs text-muted-foreground">
                          {categoryInfo.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Settings List */}
                  <div className="divide-y divide-paws-sand/30">
                    {categorySettings.map((setting) => (
                      <div
                        key={setting.id}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-paws-brown-dark">
                            {formatSettingKey(setting.key)}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {setting.key}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm text-paws-brown bg-paws-cream/70 px-3 py-1 rounded-lg max-w-[200px] truncate">
                            {setting.value}
                          </span>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State: Default Settings Form */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-paws-sand p-8">
            <div className="flex flex-col items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-paws-cream rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-paws-brown" />
              </div>
              <div className="text-center">
                <p className="font-medium text-paws-brown-dark">No system settings configured</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Initialize your system with recommended default settings below.
                </p>
              </div>
            </div>

            {/* Default Settings Preview */}
            <div className="space-y-4">
              {categoryOrder
                .filter((cat) =>
                  DEFAULT_SETTINGS.some((s) => s.category === cat)
                )
                .map((category) => {
                  const categoryInfo = CATEGORY_LABELS[category];
                  const categoryDefaults = DEFAULT_SETTINGS.filter(
                    (s) => s.category === category
                  );

                  return (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-paws-brown mb-2">
                        {categoryInfo?.label ?? category}
                      </h3>
                      <div className="bg-paws-cream/30 rounded-xl border border-paws-sand/50 divide-y divide-paws-sand/30">
                        {categoryDefaults.map((setting) => (
                          <div
                            key={setting.key}
                            className="flex items-center justify-between px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-paws-brown-dark">
                                {formatSettingKey(setting.key)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {setting.description}
                              </p>
                            </div>
                            <span className="text-xs font-mono text-muted-foreground bg-white px-2 py-1 rounded border border-paws-sand/50">
                              Not set
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Initialize Button */}
            <div className="flex justify-center mt-8">
              <Button className="gap-1.5 bg-paws-orange hover:bg-paws-orange/90 text-white">
                <Plus className="w-4 h-4" /> Initialize Default Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {hasSettings && (
        <p className="text-xs text-muted-foreground mt-3">
          {settings.length} setting{settings.length !== 1 ? "s" : ""} across{" "}
          {sortedCategories.length} categor{sortedCategories.length !== 1 ? "ies" : "y"}
        </p>
      )}
    </div>
  );
}
