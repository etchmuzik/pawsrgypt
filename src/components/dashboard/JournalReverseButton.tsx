"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { RotateCcw, Loader2 } from "lucide-react";
import { reverseJournalEntry } from "@/app/[locale]/(dashboard)/accounting/journal/actions";

interface JournalReverseButtonProps {
  entryId: string;
  alreadyReversed: boolean;
}

export function JournalReverseButton({ entryId, alreadyReversed }: JournalReverseButtonProps) {
  const router = useRouter();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const L = {
    reversed: locale === "ar" ? "تم العكس" : "Reversed",
    reverse: locale === "ar" ? "عكس" : "Reverse",
    confirm: locale === "ar" ? "إنشاء قيد عكسي؟ بيضيف قيد جديد بالمدين والدائن معكوسين." : "Create a reversing entry? This adds a new entry with debits and credits swapped.",
    failed: locale === "ar" ? "فشل العكس" : "Failed to reverse",
  };

  function handleClick() {
    if (!window.confirm(L.confirm)) return;
    setError(null);
    startTransition(async () => {
      const res = await reverseJournalEntry(entryId);
      if (!res.success) {
        setError(res.error ?? L.failed);
        return;
      }
      if (res.id) {
        router.push(`/${locale}/accounting/journal/${res.id}`);
      } else {
        router.push(`/${locale}/accounting/journal`);
      }
      router.refresh();
    });
  }

  if (alreadyReversed) {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
        {L.reversed}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-sm text-red-600">{error}</span>}
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        disabled={pending}
        onClick={handleClick}
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
        {L.reverse}
      </Button>
    </div>
  );
}
