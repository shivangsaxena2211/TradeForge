import { NextResponse } from "next/server";

import { logServerError } from "@/lib/api/safe-error";
import { getCurrentUser } from "@/lib/auth/session";
import { getTransactionListForUser } from "@/lib/transactions/service";
import { transactionListQuerySchema } from "@/lib/validation/transactions";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = transactionListQuerySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid query." },
        { status: 400 },
      );
    }

    const result = await getTransactionListForUser(user.id, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    logServerError("Transactions fetch failed", error);
    return NextResponse.json(
      { error: "Unable to load transactions." },
      { status: 500 },
    );
  }
}
