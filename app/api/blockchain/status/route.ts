import { NextResponse } from "next/server";

import { getBlockchainStatus } from "@/lib/blockchain/status";

export async function GET() {
  const status = await getBlockchainStatus();

  return NextResponse.json(status);
}
