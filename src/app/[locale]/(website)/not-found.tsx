"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PawPrint } from "lucide-react";

export default function NotFound() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-paws-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <PawPrint className="w-8 h-8 text-paws-orange" />
        </div>
        <h1 className="text-4xl font-extrabold text-neutral-900 mb-2">404</h1>
        <p className="text-lg text-muted-foreground mb-6">
          This page has wandered off. Let&apos;s get you back on track.
        </p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center justify-center px-6 py-3 bg-paws-orange hover:bg-paws-orange/90 text-white font-medium rounded-xl transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
