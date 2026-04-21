"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Send, X, Loader2 } from "lucide-react";
import {
  markPurchaseOrderReceived,
  markPurchaseOrderOrdered,
  cancelPurchaseOrder,
} from "@/app/[locale]/(dashboard)/purchases/[id]/actions";

interface PurchaseOrderActionsProps {
  orderId: string;
  status: string;
}

export function PurchaseOrderActions({ orderId, status }: PurchaseOrderActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function runAction(action: () => Promise<{ success: boolean; error?: string }>, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.success) {
        setError(res.error ?? "Action failed");
        return;
      }
      router.refresh();
    });
  }

  const isDone = status === "received" || status === "cancelled";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "draft" && (
        <Button
          size="sm"
          className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          disabled={pending}
          onClick={() => runAction(() => markPurchaseOrderOrdered(orderId))}
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Mark as Ordered
        </Button>
      )}

      {(status === "draft" || status === "ordered") && (
        <Button
          size="sm"
          className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
          disabled={pending}
          onClick={() =>
            runAction(
              () => markPurchaseOrderReceived(orderId),
              "Mark this order as received? Stock levels will be updated.",
            )
          }
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Mark as Received
        </Button>
      )}

      {!isDone && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          disabled={pending}
          onClick={() =>
            runAction(() => cancelPurchaseOrder(orderId), "Cancel this purchase order?")
          }
        >
          <X className="w-4 h-4" />
          Cancel
        </Button>
      )}

      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
