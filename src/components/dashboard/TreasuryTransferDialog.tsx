"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeftRight, Loader2, X } from "lucide-react";
import { transferBetweenAccounts } from "@/app/[locale]/(dashboard)/accounting/treasury/actions";

interface AccountOption {
  id: string;
  name_en: string;
  currency: string;
  balance: number;
}

interface TreasuryTransferDialogProps {
  accounts: AccountOption[];
}

export function TreasuryTransferDialog({ accounts }: TreasuryTransferDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  function reset() {
    setFromId("");
    setToId("");
    setAmount("");
    setNote("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await transferBetweenAccounts(fromId, toId, Number(amount), note || null);
      if (!res.success) {
        setError(res.error ?? "Transfer failed");
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 border-paws-orange text-paws-orange hover:bg-paws-orange/5"
        onClick={() => setOpen(true)}
        disabled={accounts.length < 2}
      >
        <ArrowLeftRight className="w-4 h-4" /> Transfer
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 border border-paws-sand">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900">Transfer Between Accounts</h2>
              <button
                type="button"
                onClick={() => { setOpen(false); reset(); }}
                className="text-muted-foreground hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="from">From</Label>
                <select
                  id="from"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                  required
                >
                  <option value="">— Select —</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name_en} ({a.currency}) · {a.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="to">To</Label>
                <select
                  id="to"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                  required
                >
                  <option value="">— Select —</option>
                  {accounts.filter((a) => a.id !== fromId).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name_en} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="note">Note (optional)</Label>
                <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={pending} className="bg-paws-orange hover:bg-paws-orange/90 text-white flex-1">
                  {pending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Transfer
                </Button>
                <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
