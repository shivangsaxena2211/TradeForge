import { NextResponse } from "next/server";

import { logServerError } from "@/lib/api/safe-error";
import { getMarketStatus } from "@/lib/market/service";

export async function GET() {
  try {
    const status = await getMarketStatus();
    return NextResponse.json(status);
  } catch (error) {
    logServerError("Market status fetch failed", error);
    return NextResponse.json(
      { error: "Unable to load market status." },
      { status: 503 },
    );
  }
}
