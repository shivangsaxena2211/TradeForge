import type { Metadata } from "next";

import { WalletDashboard } from "@/components/wallet/wallet-dashboard";
import { requireAuth } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Wallet",
};

export default async function WalletPage() {
  const user = await requireAuth();

  return <WalletDashboard userId={user.id} />;
}
