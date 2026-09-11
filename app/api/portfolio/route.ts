import { NextResponse } from "next/server";

import { logServerError } from "@/lib/api/safe-error";
import { getCurrentUser } from "@/lib/auth/session";
import { getPortfolioForUser } from "@/lib/portfolio/service";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const portfolio = await getPortfolioForUser(user.id);
    return NextResponse.json(portfolio);
  } catch (error) {
    logServerError("Portfolio fetch failed", error);
    return NextResponse.json(
      { error: "Unable to load portfolio." },
      { status: 500 },
    );
  }
}
