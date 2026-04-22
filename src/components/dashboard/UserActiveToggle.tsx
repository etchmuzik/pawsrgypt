"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setUserActive } from "@/app/[locale]/(dashboard)/settings/users/actions";

interface UserActiveToggleProps {
  id: string;
  isActive: boolean;
  userName: string;
}

export function UserActiveToggle({ id, isActive, userName }: UserActiveToggleProps) {
  const router = useRouter();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState(isActive);
  const L = {
    deactivate: locale === "ar" ? "إلغاء التفعيل" : "Deactivate",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    confirmDeact: locale === "ar" ? `متأكد عايز تلغي تفعيل ${userName}؟` : `Are you sure you want to deactivate ${userName}?`,
    confirmAct: locale === "ar" ? `متأكد عايز تفعل ${userName}؟` : `Are you sure you want to activate ${userName}?`,
    failed: locale === "ar" ? "فشل تحديث المستخدم." : "Failed to update user.",
    done: (next: boolean) => locale === "ar" ? (next ? "تم تفعيل المستخدم." : "تم إلغاء تفعيل المستخدم.") : (next ? "User activated." : "User deactivated."),
  };

  function handleClick() {
    const next = !optimistic;
    if (!confirm(next ? L.confirmAct : L.confirmDeact)) return;

    startTransition(async () => {
      const result = await setUserActive(id, next);
      if (!result.ok) {
        toast.error(result.error ?? L.failed);
        return;
      }
      setOptimistic(next);
      toast.success(L.done(next));
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={handleClick}
      className="h-7 text-xs text-muted-foreground"
    >
      {optimistic ? L.deactivate : L.activate}
    </Button>
  );
}
