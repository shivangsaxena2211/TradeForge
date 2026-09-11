import { NextResponse } from "next/server";

import { logServerError } from "@/lib/api/safe-error";
import { getCurrentUser } from "@/lib/auth/session";
import { syncOrderFromTransaction } from "@/lib/trading/service";
import { syncOrderSchema } from "@/lib/validation/trading";
import { uuidParamSchema } from "@/lib/validation/common";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    const parsedId = uuidParamSchema.safeParse(id);

    if (!parsedId.success) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const body = await request.json();
    const parsed = syncOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid transaction hash." },
        { status: 400 },
      );
    }

    const result = await syncOrderFromTransaction(
      user.id,
      parsedId.data,
      parsed.data.txHash,
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          blockchainSucceeded: result.blockchainSucceeded ?? false,
        },
        { status: result.blockchainSucceeded ? 502 : 400 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    logServerError("Order sync failed", error);
    return NextResponse.json(
      { error: "Unable to synchronize trade." },
      { status: 500 },
    );
  }
}
