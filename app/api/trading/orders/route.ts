import { NextResponse } from "next/server";

import type { OrderStatus } from "@/lib/generated/prisma/client";
import { logServerError } from "@/lib/api/safe-error";
import { getCurrentUser } from "@/lib/auth/session";
import { shareInputToUnits } from "@/lib/trading/precision";
import { createPendingOrder, getOrderListForUser } from "@/lib/trading/service";
import { createOrderSchema } from "@/lib/validation/trading";

const ORDER_STATUS_FILTERS = new Set([
  "ALL",
  "PENDING",
  "EXECUTED",
  "FAILED",
  "CANCELLED",
]);

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = (searchParams.get("status") ?? "ALL").toUpperCase();

    if (!ORDER_STATUS_FILTERS.has(statusParam)) {
      return NextResponse.json(
        { error: "Invalid order status filter." },
        { status: 400 },
      );
    }

    const orders = await getOrderListForUser(
      user.id,
      statusParam as OrderStatus | "ALL",
    );

    return NextResponse.json({ orders });
  } catch (error) {
    logServerError("Orders fetch failed", error);
    return NextResponse.json(
      { error: "Unable to load orders." },
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
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid order request." },
        { status: 400 },
      );
    }

    const quantityUnits = shareInputToUnits(parsed.data.quantity);

    if (!quantityUnits) {
      return NextResponse.json(
        { error: "Quantity must be greater than zero." },
        { status: 400 },
      );
    }

    if (quantityUnits.toString() !== parsed.data.quantityUnits) {
      return NextResponse.json(
        { error: "Quantity units mismatch." },
        { status: 400 },
      );
    }

    const result = await createPendingOrder(
      user.id,
      parsed.data.symbol,
      parsed.data.side,
      quantityUnits,
      parsed.data.onChainStockId,
      BigInt(parsed.data.requestedPricePaise),
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    logServerError("Create order failed", error);
    return NextResponse.json(
      { error: "Unable to create order." },
      { status: 500 },
    );
  }
}
