"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { toggleBranchActive } from "@/app/[locale]/(dashboard)/settings/branches/actions";

interface BranchActiveToggleProps {
  id: string;
  isActive: boolean;
}

export function BranchActiveToggle({ id, isActive }: BranchActiveToggleProps) {
  const router = useRouter();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState(isActive);
  const L = {
    deactivate: locale === "ar" ? "إلغاء التفعيل" : "Deactivate",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    confirmDeact: locale === "ar" ? "إلغاء تفعيل الفرع ده؟" : "Deactivate this branch?",
    confirmAct: locale === "ar" ? "تفعيل الفرع ده؟" : "Activate this branch?",
  };

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !active;
    if (!window.confirm(next ? L.confirmAct : L.confirmDeact)) return;
    startTransition(async () => {
      const res = await toggleBranchActive(id, next);
      if (res.success) {
        setActive(next);
        router.refresh();
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 text-xs flex-1 text-muted-foreground"
      disabled={pending}
      onClick={handleClick}
    >
      {active ? L.deactivate : L.activate}
    </Button>
  );
}
