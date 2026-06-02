"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Layers } from "lucide-react";
import { ConsolidateWeightsDialog } from "@/components/dashboard/ConsolidateWeightsDialog";

export function ConsolidateWeightsButton() {
  const [open, setOpen] = useState(false);
  const isAr = useLocale() === "ar";
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5 border-paws-sand">
        <Layers className="w-4 h-4" />
        {isAr ? "دمج الأوزان" : "Consolidate weights"}
      </Button>
      <ConsolidateWeightsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
