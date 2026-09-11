import { NextResponse } from "next/server";

import { logServerError } from "@/lib/api/safe-error";
import { getCurrentUser } from "@/lib/auth/session";
import { addToWatchlist, getUserWatchlist } from "@/lib/market/service";
import { watchlistSymbolSchema } from "@/lib/validation/market";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const watchlist = await getUserWatchlist(user.id);

    return NextResponse.json({ watchlist });
  } catch (error) {
    logServerError("Watchlist GET failed", error);
    return NextResponse.json(
      { error: "Unable to load watchlist." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const body = await request.json();
    const parsed = watchlistSymbolSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 },
      );
    }

    const result = await addToWatchlist(user.id, parsed.data.symbol);

    if (!result.success) {
      const status = result.error.includes("already") ? 409 : 404;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("Watchlist POST failed", error);
    return NextResponse.json(
      { error: "Unable to update watchlist." },
      { status: 500 },
    );
  }
}
