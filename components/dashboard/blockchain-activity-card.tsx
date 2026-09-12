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
      description="Local simulated execution layer (Chain 31337)."
      compact
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-surface-inset px-3 py-2">
          <div className="flex items-center gap-2">
            <Blocks className="size-3.5 text-primary" aria-hidden="true" />
            <span className="text-xs font-medium">{blockchainConfig.networkName}</span>
          </div>
          <StatusBadge status={connected ? "Connected" : "Unavailable"} />
        </div>

        <dl className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-md bg-surface-inset px-2 py-1.5">
            <dt className="text-muted-foreground">Chain ID</dt>
            <dd className="font-mono font-semibold">{blockchainConfig.chainId}</dd>
          </div>
          <div className="rounded-md bg-surface-inset px-2 py-1.5">
            <dt className="text-muted-foreground">Block</dt>
            <dd className="font-mono font-semibold">
              {connected && status?.blockNumber !== null ? status?.blockNumber : "—"}
            </dd>
          </div>
          <div className="rounded-md bg-surface-inset px-2 py-1.5">
            <dt className="flex items-center gap-1 text-muted-foreground">
              <Activity className="size-3" aria-hidden="true" />
              Trades
            </dt>
            <dd className="font-semibold">{recentTradeCount}</dd>
          </div>
          <div className="rounded-md bg-surface-inset px-2 py-1.5">
            <dt className="flex items-center gap-1 text-muted-foreground">
              <Link2 className="size-3" aria-hidden="true" />
              Latest Tx
            </dt>
            <dd className="truncate">
              {recentTxHash ? (
                <TxHashCopy txHash={recentTxHash} />
              ) : (
                <span className="text-muted-foreground">None</span>
              )}
            </dd>
          </div>
        </dl>

        {!connected ? (
          <p className="text-[10px] text-muted-foreground">
            Blockchain unavailable. Start Anvil for live trading and verification.
          </p>
        ) : null}
      </div>
    </SectionCard>
  );
}
