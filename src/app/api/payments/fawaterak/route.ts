import { NextResponse } from "next/server";
import { paymentConfig } from "@/lib/payments/fawaterak";

export async function GET() {
  const config = paymentConfig();
  return NextResponse.json(
    {
      available: Boolean(config),
      test_mode: config?.environment === "staging",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
