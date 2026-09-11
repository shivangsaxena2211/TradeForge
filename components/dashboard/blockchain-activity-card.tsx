import { Activity, Blocks, Link2 } from "lucide-react";

import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { TxHashCopy } from "@/components/shared/tx-hash-copy";
import { blockchainConfig } from "@/lib/blockchain/config";
import type { BlockchainStatus } from "@/lib/blockchain/types";

type BlockchainActivityCardProps = {
  status: BlockchainStatus | null;
  recentTxHash?: string | null;
  recentTradeCount?: number;
};

export function BlockchainActivityCard({
  status,
  recentTxHash,
  recentTradeCount = 0,
}: BlockchainActivityCardProps) {
  const connected = status?.connected ?? false;

  return (
    <SectionCard
      title="Blockchain Activity"
      description="DEFINN Local Network — simulated on-chain execution layer."
      className="definn-card-glow"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Network</p>
            <StatusBadge status={connected ? "Connected" : "Unavailable"} />
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{blockchainConfig.networkName}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Chain ID</dt>
              <dd className="font-mono font-medium">{blockchainConfig.chainId}</dd>
            </div>
            {connected && status?.blockNumber !== null ? (
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Blocks className="size-3.5" aria-hidden="true" />
                  Block
                </dt>
                <dd className="font-mono font-medium">{status?.blockNumber}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" aria-hidden="true" />
            <p className="text-sm font-medium">Recent Activity</p>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Confirmed trades</dt>
              <dd className="font-medium">{recentTradeCount}</dd>
            </div>
            {recentTxHash ? (
              <div className="space-y-1">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Link2 className="size-3.5" aria-hidden="true" />
                  Latest transaction
                </dt>
                <dd>
                  <TxHashCopy txHash={recentTxHash} />
                </dd>
              </div>
            ) : (
              <p className="text-muted-foreground">No confirmed transactions yet.</p>
            )}
          </dl>
        </div>
      </div>

      {!connected ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Blockchain unavailable. Historical records remain visible; live verification and trading require Anvil.
        </p>
      ) : null}
    </SectionCard>
  );
}
