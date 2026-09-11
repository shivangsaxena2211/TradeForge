import { NextResponse } from "next/server";

import { logServerError } from "@/lib/api/safe-error";
import { getCurrentUser } from "@/lib/auth/session";
import { removeFromWatchlist } from "@/lib/market/service";
import { isValidSymbol } from "@/lib/market/search";

type RouteContext = {
  params: Promise<{ symbol: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { symbol } = await context.params;

    if (!isValidSymbol(symbol)) {
      return NextResponse.json({ error: "Invalid stock symbol." }, { status: 400 });
    }

    const result = await removeFromWatchlist(user.id, symbol);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("Watchlist DELETE failed", error);
    return NextResponse.json(
      { error: "Unable to update watchlist." },
      { status: 500 },
    );
  }
}
