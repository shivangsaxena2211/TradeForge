import { NextResponse } from "next/server";

import { logServerError } from "@/lib/api/safe-error";
import { getCurrentUser } from "@/lib/auth/session";
import { cancelPendingOrder } from "@/lib/trading/service";
import { uuidParamSchema } from "@/lib/validation/common";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
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

    const result = await cancelPendingOrder(user.id, parsedId.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("Cancel order failed", error);
    return NextResponse.json(
      { error: "Unable to cancel order." },
      { status: 500 },
    );
  }
}
