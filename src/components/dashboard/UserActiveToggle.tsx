"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState(isActive);

  function handleClick() {
    const next = !optimistic;
    const verb = next ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${verb} ${userName}?`)) return;

    startTransition(async () => {
      const result = await setUserActive(id, next);
      if (!result.ok) {
        toast.error(result.error ?? "Failed to update user.");
        return;
      }
      setOptimistic(next);
      toast.success(`User ${next ? "activated" : "deactivated"}.`);
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
      {optimistic ? "Deactivate" : "Activate"}
    </Button>
  );
}
