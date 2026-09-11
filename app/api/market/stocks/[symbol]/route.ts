import { NextResponse } from "next/server";

import { logServerError } from "@/lib/api/safe-error";
import { getCurrentUser } from "@/lib/auth/session";
import { getStockBySymbol, isStockInWatchlist } from "@/lib/market/service";
import { isValidSymbol } from "@/lib/market/search";

type RouteContext = {
  params: Promise<{ symbol: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { symbol } = await context.params;

    if (!isValidSymbol(symbol)) {
      return NextResponse.json({ error: "Invalid stock symbol." }, { status: 400 });
    }

    const stock = await getStockBySymbol(symbol);

    if (!stock) {
      return NextResponse.json({ error: "Stock not found." }, { status: 404 });
    }

    const user = await getCurrentUser();
    const inWatchlist = user
      ? await isStockInWatchlist(user.id, symbol)
      : false;

    return NextResponse.json({
      stock,
      inWatchlist,
      disclaimer:
        "DEFINN market prices are simulated and are not real NSE/BSE market prices.",
    });
  } catch (error) {
    logServerError("Market stock detail API failed", error);
    return NextResponse.json(
      { error: "Unable to load stock details." },
      { status: 500 },
    );
  }
}
