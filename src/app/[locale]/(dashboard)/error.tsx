"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Dashboard Error</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Something went wrong loading this page.
        </p>
        <Button
          onClick={reset}
          className="bg-paws-orange hover:bg-paws-orange/90 text-white"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
