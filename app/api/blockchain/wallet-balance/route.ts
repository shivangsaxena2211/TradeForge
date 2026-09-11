import { NextResponse } from "next/server";

import { logServerError } from "@/lib/api/safe-error";
import { requireAuth } from "@/lib/auth/session";
import { getNativeBalance, getBlockchainStatus } from "@/lib/blockchain/status";
import { getWalletMetadata } from "@/lib/wallet/server";

export async function GET() {
  try {
    await requireAuth();
    const wallet = await getWalletMetadata();

    if (!wallet) {
      return NextResponse.json(
        { error: "No DEFINN wallet registered for this account." },
        { status: 404 },
      );
    }

    const status = await getBlockchainStatus();
    const balance = status.connected
      ? await getNativeBalance(wallet.address)
      : "0.0000 ETH";

    return NextResponse.json({
      address: wallet.address,
      balance,
      connected: status.connected,
      networkName: status.networkName,
      chainId: status.chainId,
    });
  } catch (error) {
    logServerError("Wallet balance lookup failed", error);

    return NextResponse.json(
      { error: "Could not retrieve wallet blockchain balance." },
      { status: 500 },
    );
  }
}
