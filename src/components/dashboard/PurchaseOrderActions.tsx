"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
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
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const L = {
    ordered: locale === "ar" ? "علّم كأمر شراء" : "Mark as Ordered",
    received: locale === "ar" ? "علّم كمستلم" : "Mark as Received",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    confirmReceive: locale === "ar" ? "تعليم الطلب كمستلم؟ المخزون هيتحدث." : "Mark this order as received? Stock levels will be updated.",
    confirmCancel: locale === "ar" ? "إلغاء أمر الشراء ده؟" : "Cancel this purchase order?",
    failed: locale === "ar" ? "فشلت العملية" : "Action failed",
  };

  function runAction(action: () => Promise<{ success: boolean; error?: string }>, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.success) {
        setError(res.error ?? L.failed);
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
          {L.ordered}
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
              L.confirmReceive,
            )
          }
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {L.received}
        </Button>
      )}

      {!isDone && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          disabled={pending}
          onClick={() =>
            runAction(() => cancelPurchaseOrder(orderId), L.confirmCancel)
          }
        >
          <X className="w-4 h-4" />
          {L.cancel}
        </Button>
      )}

      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
