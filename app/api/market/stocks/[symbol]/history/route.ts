import { NextResponse } from "next/server";

import { logServerError } from "@/lib/api/safe-error";
import { getPriceHistory } from "@/lib/market/service";
import { isValidSymbol } from "@/lib/market/search";
import { priceHistoryQuerySchema } from "@/lib/validation/market";

type RouteContext = {
  params: Promise<{ symbol: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { symbol } = await context.params;

    if (!isValidSymbol(symbol)) {
      return NextResponse.json({ error: "Invalid stock symbol." }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = priceHistoryQuerySchema.safeParse({
      limit: searchParams.get("limit") ?? undefined,
      source: searchParams.get("source") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid history query parameters." },
        { status: 400 },
      );
    }

    const history = await getPriceHistory(symbol, parsed.data.limit, {
      source: parsed.data.source,
    });

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      history,
      disclaimer: "Simulated price history — not real exchange data.",
    });
  } catch (error) {
    logServerError("Market history API failed", error);
    return NextResponse.json(
      { error: "Unable to load price history." },
      { status: 500 },
    );
  }
}
