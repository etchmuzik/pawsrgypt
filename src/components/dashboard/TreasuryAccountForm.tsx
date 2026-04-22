"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
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
        setError(res.error ?? "Failed to save");
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
          <Label htmlFor="name_en">English Name</Label>
          <Input id="name_en" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="name_ar">Arabic Name</Label>
          <Input id="name_ar" value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as TreasuryType)}
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
          </select>
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={5} required />
        </div>
        <div>
          <Label htmlFor="branch">Branch (optional)</Label>
          <select
            id="branch"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">— None —</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {mode === "create" && (
        <div>
          <Label htmlFor="balance">Opening Balance</Label>
          <Input
            id="balance"
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">Balance is managed via transfers or adjustments after creation.</p>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Active
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="bg-paws-orange hover:bg-paws-orange/90 text-white">
          {pending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {mode === "create" ? "Create Account" : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
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
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newBalance, setNewBalance] = useState(String(currentBalance));
  const [reason, setReason] = useState("");

  function handleAdjust(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setSuccess(false);
    if (!window.confirm(`Adjust balance from ${currentBalance.toFixed(2)} to ${Number(newBalance).toFixed(2)} ${currency}? This will be logged to the audit trail.`)) return;
    startTransition(async () => {
      const res = await adjustTreasuryBalance(id, Number(newBalance), reason);
      if (!res.success) {
        setError(res.error ?? "Failed to adjust");
        return;
      }
      setSuccess(true);
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="mt-8 pt-6 border-t border-neutral-200">
      <h3 className="text-sm font-semibold text-neutral-900 mb-1">Balance Adjustment</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Direct balance changes bypass transfers and are recorded to the audit log with the reason provided.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="new_balance" className="text-xs">New Balance ({currency})</Label>
          <Input
            id="new_balance"
            type="number"
            step="0.01"
            value={newBalance}
            onChange={(e) => setNewBalance(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="reason" className="text-xs">Reason (required)</Label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Bank reconciliation correction"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {success && <p className="text-sm text-green-700 mt-2">Balance adjusted and logged.</p>}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-3 gap-1.5"
        disabled={pending || !reason.trim() || Number(newBalance) === currentBalance}
        onClick={handleAdjust}
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        Adjust Balance
      </Button>
    </div>
  );
}
