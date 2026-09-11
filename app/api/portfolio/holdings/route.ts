import { NextResponse } from "next/server";

import { logServerError } from "@/lib/api/safe-error";
import { getCurrentUser } from "@/lib/auth/session";
import { getHoldingsForUser } from "@/lib/portfolio/service";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const holdings = await getHoldingsForUser(user.id);
    return NextResponse.json({ holdings });
  } catch (error) {
    logServerError("Holdings fetch failed", error);
    return NextResponse.json(
      { error: "Unable to load holdings." },
      { status: 500 },
    );
  }
}
