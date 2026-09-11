import { NextResponse } from "next/server";

import { logServerError } from "@/lib/api/safe-error";
import { getCurrentUser } from "@/lib/auth/session";
import { getRecentTradesForUser } from "@/lib/trading/service";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const trades = await getRecentTradesForUser(user.id, 5);

    return NextResponse.json({
      trades: trades.map((trade) => ({
        id: trade.id,
        symbol: trade.stock.symbol,
        companyName: trade.stock.companyName,
        side: trade.side,
        quantity: trade.quantity.toString(),
        price: trade.price.toString(),
        totalValue: trade.totalValue.toString(),
        executedAt: trade.executedAt.toISOString(),
      })),
    });
  } catch (error) {
    logServerError("Recent trades API failed", error);
    return NextResponse.json(
      { error: "Unable to load recent trades." },
      { status: 500 },
    );
  }
}
