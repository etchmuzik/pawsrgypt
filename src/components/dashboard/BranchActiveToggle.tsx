"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toggleBranchActive } from "@/app/[locale]/(dashboard)/settings/branches/actions";

interface BranchActiveToggleProps {
  id: string;
  isActive: boolean;
}

export function BranchActiveToggle({ id, isActive }: BranchActiveToggleProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState(isActive);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !active;
    const label = next ? "Activate this branch?" : "Deactivate this branch?";
    if (!window.confirm(label)) return;
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
      {active ? "Deactivate" : "Activate"}
    </Button>
  );
}
