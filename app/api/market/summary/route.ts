import { NextResponse } from "next/server";

import { logServerError } from "@/lib/api/safe-error";
import { getMarketSummary } from "@/lib/market/service";

export async function GET() {
  try {
    const summary = await getMarketSummary();
    return NextResponse.json(summary);
  } catch (error) {
    logServerError("Market summary API failed", error);
    return NextResponse.json(
      { error: "Unable to load market summary." },
      { status: 500 },
    );
  }
}
