"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function DashboardNotFound() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center max-w-md">
        <h2 className="text-4xl font-extrabold text-neutral-900 mb-2">404</h2>
        <p className="text-muted-foreground mb-4">
          This dashboard page doesn&apos;t exist.
        </p>
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-paws-orange hover:bg-paws-orange/90 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
