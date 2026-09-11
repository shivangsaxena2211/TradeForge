import { NextResponse } from "next/server";

import { logServerError } from "@/lib/api/safe-error";
import { getCurrentUser } from "@/lib/auth/session";
import { getTransactionDetailForUser } from "@/lib/transactions/service";
import { uuidParamSchema } from "@/lib/validation/common";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    const parsedId = uuidParamSchema.safeParse(id);

    if (!parsedId.success) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    const transaction = await getTransactionDetailForUser(user.id, parsedId.data);

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    logServerError("Transaction detail fetch failed", error);
    return NextResponse.json(
      { error: "Unable to load transaction." },
      { status: 500 },
    );
  }
}
