import { AlertTriangle, Copy, Lock, Unlock, Wallet } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { blockchainConfig } from "@/lib/blockchain/config";
import { DEFINN_WALLET_TYPE } from "@/lib/wallet/types";
import { truncateAddress } from "@/lib/wallet/format";

type WalletDetailsCardProps = {
  address: string;
  isUnlocked: boolean;
  nativeBalance?: string | null;
  blockchainConnected?: boolean;
  onLock?: () => void;
  onUnlock?: () => void;
  showActions?: boolean;
};

export function WalletDetailsCard({
  address,
  isUnlocked,
  nativeBalance,
  blockchainConnected = false,
  onLock,
  onUnlock,
  showActions = true,
}: WalletDetailsCardProps) {
  return (
    <Card className="definn-card definn-card-glow border-border/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="size-4" aria-hidden="true" />
          DEFINN Custom Wallet
        </CardTitle>
        <CardDescription>
          Academic simulation wallet — not a production hardware wallet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
          <div>
            <p className="text-sm font-medium">Status</p>
            <p className="text-sm text-muted-foreground">
              {isUnlocked ? "Unlocked" : "Locked"}
            </p>
          </div>
          <StatusBadge status={isUnlocked ? "Unlocked" : "Locked"} />
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border p-3 sm:col-span-2">
            <dt className="text-muted-foreground">Address</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <code className="font-mono text-xs break-all">{address}</code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(address)}
                aria-label="Copy wallet address"
              >
                <Copy className="size-3.5" aria-hidden="true" />
                Copy
              </Button>
            </dd>
            <p className="mt-1 text-xs text-muted-foreground">
              Short: {truncateAddress(address)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-muted-foreground">Wallet Type</dt>
            <dd className="mt-1 font-medium">{DEFINN_WALLET_TYPE}</dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-muted-foreground">Network</dt>
            <dd className="mt-1 font-medium">{blockchainConfig.networkName}</dd>
          </div>
          <div className="rounded-lg border p-3 sm:col-span-2">
            <dt className="text-muted-foreground">Native Balance (local chain)</dt>
            <dd className="mt-1 text-muted-foreground">
              {blockchainConnected
                ? (nativeBalance ?? "Loading...")
                : "Blockchain disconnected"}
            </dd>
          </div>
          <div className="rounded-lg border p-3 sm:col-span-2">
            <dt className="text-muted-foreground">Transaction Signing</dt>
            <dd className="mt-1 text-muted-foreground">
              {isUnlocked
                ? "Wallet unlocked — local signing enabled for blockchain registration"
                : "Unlock wallet to sign blockchain transactions locally"}
            </dd>
          </div>
        </dl>

        {showActions ? (
          <div className="flex flex-wrap gap-2">
            {isUnlocked ? (
              <Button type="button" variant="outline" onClick={onLock}>
                <Lock className="size-4" aria-hidden="true" />
                Lock Wallet
              </Button>
            ) : (
              <Button type="button" onClick={onUnlock}>
                <Unlock className="size-4" aria-hidden="true" />
                Unlock Wallet
              </Button>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function WalletSecurityNotice() {
  return (
    <div
      className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm"
      role="note"
    >
      <AlertTriangle
        className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden="true"
      />
      <div className="space-y-1 text-muted-foreground">
        <p className="font-medium text-foreground">Security notice</p>
        <p>
          Your recovery phrase is the only way to restore this wallet. DEFINN
          never stores your recovery phrase or private key in PostgreSQL. If you
          lose your recovery phrase and forget your wallet password, access
          cannot be recovered.
        </p>
        <p>
          This is an academic simulation wallet — not equivalent to a
          production-grade hardware wallet.
        </p>
      </div>
    </div>
  );
}
