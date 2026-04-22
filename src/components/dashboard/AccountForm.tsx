"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  createAccount,
  updateAccount,
  type AccountType,
} from "@/app/[locale]/(dashboard)/accounting/accounts/actions";

interface ParentOption {
  id: string;
  code: string;
  name_en: string;
  type: string;
}

interface AccountValue {
  id?: string;
  code: string;
  name_en: string;
  name_ar: string;
  type: AccountType;
  parent_id: string | null;
  is_active: boolean;
}

interface AccountFormProps {
  mode: "create" | "edit";
  initial?: AccountValue;
  parents: ParentOption[];
}

const TYPES: { value: AccountType; label: string }[] = [
  { value: "asset", label: "Asset" },
  { value: "liability", label: "Liability" },
  { value: "equity", label: "Equity" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

export function AccountForm({ mode, initial, parents }: AccountFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState(initial?.code ?? "");
  const [nameEn, setNameEn] = useState(initial?.name_en ?? "");
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? "");
  const [type, setType] = useState<AccountType>(initial?.type ?? "asset");
  const [parentId, setParentId] = useState<string>(initial?.parent_id ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      code,
      name_en: nameEn,
      name_ar: nameAr,
      type,
      parent_id: parentId || null,
      is_active: isActive,
    };
    startTransition(async () => {
      const res = mode === "create"
        ? await createAccount(payload)
        : await updateAccount(initial!.id!, payload);
      if (!res.success) {
        setError(res.error ?? "Failed to save");
        return;
      }
      router.push(`/${locale}/accounting/accounts`);
      router.refresh();
    });
  }

  const validParents = parents.filter((p) => p.id !== initial?.id);

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1">
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. 1100"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="name_en">English Name</Label>
        <Input
          id="name_en"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="name_ar">Arabic Name</Label>
        <Input
          id="name_ar"
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          dir="rtl"
          required
        />
      </div>

      <div>
        <Label htmlFor="parent">Parent Account (optional)</Label>
        <select
          id="parent"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value="">— None —</option>
          {validParents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} · {p.name_en} ({p.type})
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
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
    </form>
  );
}
