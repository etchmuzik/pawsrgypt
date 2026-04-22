"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  adjustTreasuryBalance,
  createTreasuryAccount,
  updateTreasuryAccount,
  type TreasuryType,
} from "@/app/[locale]/(dashboard)/accounting/treasury/actions";

interface BranchOption {
  id: string;
  name: string;
}

interface TreasuryValue {
  id?: string;
  name_en: string;
  name_ar: string;
  type: TreasuryType;
  currency: string;
  branch_id: string | null;
  balance: number;
  is_active: boolean;
}

interface TreasuryAccountFormProps {
  mode: "create" | "edit";
  initial?: TreasuryValue;
  branches: BranchOption[];
}

export function TreasuryAccountForm({ mode, initial, branches }: TreasuryAccountFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("accounting");
  const tCommon = useTranslations("common");
  const L = {
    nameEn: locale === "ar" ? "الاسم بالإنجليزي" : "English Name",
    nameAr: locale === "ar" ? "الاسم بالعربي" : "Arabic Name",
    type: locale === "ar" ? "النوع" : "Type",
    cash: locale === "ar" ? "كاش" : "Cash",
    bank: locale === "ar" ? "بنك" : "Bank",
    currency: locale === "ar" ? "العملة" : "Currency",
    branchOpt: locale === "ar" ? "الفرع (اختياري)" : "Branch (optional)",
    none: locale === "ar" ? "— لا شيء —" : "— None —",
    openingBalance: locale === "ar" ? "الرصيد الافتتاحي" : "Opening Balance",
    balanceNote: locale === "ar" ? "الرصيد بيتعدل عن طريق التحويلات أو التعديلات بعد الإنشاء." : "Balance is managed via transfers or adjustments after creation.",
    active: locale === "ar" ? "مفعل" : "Active",
    create: locale === "ar" ? "إنشاء الحساب" : "Create Account",
  };
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [nameEn, setNameEn] = useState(initial?.name_en ?? "");
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? "");
  const [type, setType] = useState<TreasuryType>(initial?.type ?? "cash");
  const [currency, setCurrency] = useState(initial?.currency ?? "EGP");
  const [branchId, setBranchId] = useState(initial?.branch_id ?? "");
  const [balance, setBalance] = useState(String(initial?.balance ?? 0));
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      name_en: nameEn,
      name_ar: nameAr,
      type,
      currency,
      branch_id: branchId || null,
      balance: Number(balance) || 0,
      is_active: isActive,
    };
    startTransition(async () => {
      const res = mode === "create"
        ? await createTreasuryAccount(payload)
        : await updateTreasuryAccount(initial!.id!, payload);
      if (!res.success) {
        setError(res.error ?? tCommon("error"));
        return;
      }
      router.push(`/${locale}/accounting/treasury`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name_en">{L.nameEn}</Label>
          <Input id="name_en" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="name_ar">{L.nameAr}</Label>
          <Input id="name_ar" value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="type">{L.type}</Label>
          <select
            id="type"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as TreasuryType)}
          >
            <option value="cash">{L.cash}</option>
            <option value="bank">{L.bank}</option>
          </select>
        </div>
        <div>
          <Label htmlFor="currency">{L.currency}</Label>
          <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={5} required />
        </div>
        <div>
          <Label htmlFor="branch">{L.branchOpt}</Label>
          <select
            id="branch"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">{L.none}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {mode === "create" && (
        <div>
          <Label htmlFor="balance">{L.openingBalance}</Label>
          <Input
            id="balance"
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">{L.balanceNote}</p>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        {L.active}
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="bg-paws-orange hover:bg-paws-orange/90 text-white">
          {pending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {mode === "create" ? L.create : tCommon("save_changes")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tCommon("cancel")}
        </Button>
      </div>

      {mode === "edit" && initial?.id && (
        <BalanceAdjustmentSection
          id={initial.id}
          currentBalance={initial.balance}
          currency={initial.currency}
        />
      )}
    </form>
  );
}

interface BalanceAdjustmentSectionProps {
  id: string;
  currentBalance: number;
  currency: string;
}

function BalanceAdjustmentSection({ id, currentBalance, currency }: BalanceAdjustmentSectionProps) {
  const router = useRouter();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newBalance, setNewBalance] = useState(String(currentBalance));
  const [reason, setReason] = useState("");
  const L = {
    title: locale === "ar" ? "تعديل الرصيد" : "Balance Adjustment",
    note: locale === "ar" ? "التعديل المباشر بيتجاوز التحويلات وبيتسجل في سجل التدقيق مع السبب." : "Direct balance changes bypass transfers and are recorded to the audit log with the reason provided.",
    newBalance: locale === "ar" ? "الرصيد الجديد" : "New Balance",
    reason: locale === "ar" ? "السبب (مطلوب)" : "Reason (required)",
    reasonPlaceholder: locale === "ar" ? "مثلا: تسوية بنك" : "e.g. Bank reconciliation correction",
    adjust: locale === "ar" ? "عدل الرصيد" : "Adjust Balance",
    done: locale === "ar" ? "تم التعديل والتسجيل." : "Balance adjusted and logged.",
    confirm: locale === "ar" ? `تعديل الرصيد من ${currentBalance.toFixed(2)} لـ ${Number(newBalance).toFixed(2)} ${currency}؟ هيتسجل في سجل التدقيق.` : `Adjust balance from ${currentBalance.toFixed(2)} to ${Number(newBalance).toFixed(2)} ${currency}? This will be logged to the audit trail.`,
    failed: locale === "ar" ? "فشل التعديل" : "Failed to adjust",
  };

  function handleAdjust(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setSuccess(false);
    if (!window.confirm(L.confirm)) return;
    startTransition(async () => {
      const res = await adjustTreasuryBalance(id, Number(newBalance), reason);
      if (!res.success) {
        setError(res.error ?? L.failed);
        return;
      }
      setSuccess(true);
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="mt-8 pt-6 border-t border-neutral-200">
      <h3 className="text-sm font-semibold text-neutral-900 mb-1">{L.title}</h3>
      <p className="text-xs text-muted-foreground mb-3">{L.note}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="new_balance" className="text-xs">{L.newBalance} ({currency})</Label>
          <Input
            id="new_balance"
            type="number"
            step="0.01"
            value={newBalance}
            onChange={(e) => setNewBalance(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="reason" className="text-xs">{L.reason}</Label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={L.reasonPlaceholder}
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {success && <p className="text-sm text-green-700 mt-2">{L.done}</p>}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-3 gap-1.5"
        disabled={pending || !reason.trim() || Number(newBalance) === currentBalance}
        onClick={handleAdjust}
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        {L.adjust}
      </Button>
    </div>
  );
}
