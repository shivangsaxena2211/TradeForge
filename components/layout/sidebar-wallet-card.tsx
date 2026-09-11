"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";

import { useWalletContext } from "@/components/wallet/wallet-provider";
import { truncateAddress } from "@/lib/wallet/format";

export function SidebarWalletCard() {
  const {
    metadata,
    isUnlocked,
    hasWallet,
    hasLocalKeystore,
    blockchainConnected,
  } = useWalletContext();

  if (!hasWallet || !metadata) {
    return (
      <Link
        href="/wallet"
        className="definn-card block p-3 transition-colors hover:border-primary/30"
      >
        <div className="flex items-center gap-2">
          <div className="definn-kpi-icon size-9 rounded-lg">
            <Wallet className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              DEFINN Wallet
            </p>
            <p className="text-sm font-medium">Not configured</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-primary">Create wallet →</p>
      </Link>
    );
  }

  const statusLabel = !blockchainConnected
    ? "Network offline"
    : !hasLocalKeystore
      ? "Device missing"
      : isUnlocked
        ? "Connected"
        : "Locked";

  const statusColor =
    statusLabel === "Connected"
      ? "text-success"
      : statusLabel === "Locked"
        ? "text-warning"
        : "text-muted-foreground";

  return (
    <Link
      href="/wallet"
      className="definn-card definn-card-glow block p-3 transition-colors hover:border-primary/40"
      aria-label={`DEFINN Wallet ${statusLabel}`}
    >
      <div className="flex items-center gap-2">
        <div className="definn-kpi-icon size-9 rounded-lg">
          <Wallet className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            DEFINN Wallet
          </p>
          <p className="truncate font-mono text-sm font-medium">
            {truncateAddress(metadata.address)}
          </p>
        </div>
      </div>
      <p className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${statusColor}`}>
        <span
          className={`size-1.5 rounded-full ${
            statusLabel === "Connected"
              ? "bg-success"
              : statusLabel === "Locked"
                ? "bg-warning"
                : "bg-muted-foreground"
          }`}
          aria-hidden="true"
        />
        {statusLabel}
      </p>
    </Link>
  );
}
