"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { createUser, updateUser, type UserFormInput } from "@/app/[locale]/(dashboard)/settings/users/actions";

const ROLE_VALUES = ["admin", "manager", "cashier", "warehouse", "accountant", "hr"] as const;

interface Branch {
  id: string;
  name: string;
}

interface UserFormProps {
  mode: "create" | "edit";
  branches: Branch[];
  initial?: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    branch_id: string | null;
  };
}

function randomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let out = "";
  const arr = new Uint32Array(12);
  crypto.getRandomValues(arr);
  for (let i = 0; i < arr.length; i++) {
    out += chars[arr[i] % chars.length];
  }
  return out;
}

export function UserForm({ mode, branches, initial }: UserFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tCustomers = useTranslations("customers");
  const [loading, setLoading] = useState(false);

  const roleOptions = ROLE_VALUES.map((v) => ({
    value: v,
    label: t(v === "hr" ? "hr_role" : v),
  }));

  const [form, setForm] = useState({
    email: initial?.email ?? "",
    password: mode === "create" ? randomPassword() : "",
    full_name: initial?.full_name ?? "",
    role: initial?.role ?? "cashier",
    branch_id: initial?.branch_id ?? "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload: UserFormInput = {
      email: form.email,
      full_name: form.full_name,
      role: form.role,
      branch_id: form.branch_id || null,
      password: form.password,
    };

    const result =
      mode === "create"
        ? await createUser(payload)
        : await updateUser(initial!.id, {
            full_name: payload.full_name,
            role: payload.role,
            branch_id: payload.branch_id,
          });

    setLoading(false);

    if (!result.ok) {
      toast.error(result.error ?? tCommon("error"));
      return;
    }

    toast.success(tCommon("success"));
    router.push(`/${locale}/settings/users`);
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/settings/users`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-paws-brown">
            <ArrowLeft className="w-4 h-4" /> {tCommon("back")}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-paws-brown-dark">
          {mode === "create" ? t("add_user") : t("edit_user")}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-paws-sand p-6 space-y-4">
          <h2 className="font-semibold text-paws-brown-dark text-lg">
            {t("users")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">{tCustomers("name")}</Label>
              <Input
                id="full_name"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Ahmed Hassan"
                className="bg-white border-paws-sand"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">{tCommon("email")} *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="user@example.com"
                className="bg-white border-paws-sand"
                required
                disabled={mode === "edit"}
              />
              {mode === "edit" && (
                <p className="text-xs text-muted-foreground">
                  {locale === "ar" ? "الإيميل بيتغير من لوحة Supabase Auth بس." : "Email can only be changed from the Supabase Auth dashboard."}
                </p>
              )}
            </div>

            {mode === "create" && (
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="password">{locale === "ar" ? "كلمة سر مؤقتة" : "Temporary Password"} *</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={locale === "ar" ? "8 حروف على الأقل" : "At least 8 characters"}
                    className="bg-white border-paws-sand font-mono"
                    required
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-paws-sand gap-1.5"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, password: randomPassword() }))
                    }
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> {locale === "ar" ? "إعادة توليد" : "Regenerate"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {locale === "ar" ? "اديها للمستخدم — المفروض يغيرها من أول دخول." : "Share this with the user — they should change it on first login."}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="role">{t("role")} *</Label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full h-10 rounded-md border border-paws-sand bg-white px-3 text-sm"
                required
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="branch_id">{t("branch")}</Label>
              <select
                id="branch_id"
                name="branch_id"
                value={form.branch_id}
                onChange={handleChange}
                className="w-full h-10 rounded-md border border-paws-sand bg-white px-3 text-sm"
              >
                <option value="">{t("unassigned")}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href={`/${locale}/settings/users`}>
            <Button type="button" variant="outline" className="border-paws-sand">
              {tCommon("cancel")}
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-paws-orange hover:bg-paws-orange/90 text-white gap-1.5"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? tCommon("loading") : mode === "create" ? t("add_user") : tCommon("save_changes")}
          </Button>
        </div>
      </form>
    </div>
  );
}
