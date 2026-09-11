import { NextResponse } from "next/server";

import { logServerError } from "@/lib/api/safe-error";
import { getCurrentUser } from "@/lib/auth/session";
import { listStocks } from "@/lib/market/service";
import { marketSearchSchema } from "@/lib/validation/market";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = marketSearchSchema.safeParse({
      search: searchParams.get("search") ?? undefined,
      exchange: searchParams.get("exchange") ?? undefined,
      activeOnly: searchParams.get("activeOnly") ?? undefined,
      watchlistOnly: searchParams.get("watchlistOnly") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid market query parameters." },
        { status: 400 },
      );
    }

    const user = await getCurrentUser();
    const stocks = await listStocks({
      search: parsed.data.search,
      exchange: parsed.data.exchange,
      activeOnly: parsed.data.activeOnly,
      watchlistUserId:
        parsed.data.watchlistOnly && user ? user.id : undefined,
    });

    return NextResponse.json({
      stocks,
      disclaimer:
        "DEFINN market prices are simulated and are not real NSE/BSE market prices.",
    });
  } catch (error) {
    logServerError("Market stocks API failed", error);
    return NextResponse.json(
      { error: "Unable to load market data." },
      { status: 500 },
    );
  }
}
