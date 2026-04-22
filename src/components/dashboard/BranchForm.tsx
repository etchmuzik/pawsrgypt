"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { createBranch, updateBranch } from "@/app/[locale]/(dashboard)/settings/branches/actions";

interface BranchValue {
  id?: string;
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
}

interface BranchFormProps {
  mode: "create" | "edit";
  initial?: BranchValue;
}

export function BranchForm({ mode, initial }: BranchFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      name,
      city: city || null,
      address: address || null,
      phone: phone || null,
      is_active: isActive,
    };
    startTransition(async () => {
      const res = mode === "create"
        ? await createBranch(payload)
        : await updateBranch(initial!.id!, payload);
      if (!res.success) {
        setError(res.error ?? "Failed to save");
        return;
      }
      router.push(`/${locale}/settings/branches`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Active
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="bg-paws-orange hover:bg-paws-orange/90 text-white">
          {pending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {mode === "create" ? "Create Branch" : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
