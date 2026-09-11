import { AppShell } from "@/components/layout";
import { WalletProvider } from "@/components/wallet/wallet-provider";
import { requireAuth } from "@/lib/auth/session";
import { getWalletMetadata } from "@/lib/wallet/server";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const walletMetadata = await getWalletMetadata();

  return (
    <WalletProvider userId={user.id} initialMetadata={walletMetadata}>
      <AppShell user={user}>{children}</AppShell>
    </WalletProvider>
  );
}
