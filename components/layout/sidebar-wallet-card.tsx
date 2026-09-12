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
        className="definn-card block p-2.5 transition-colors hover:border-primary/30"
      >
        <div className="flex items-center gap-2">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"
            aria-hidden="true"
          >
            <Wallet className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              DEFINN Wallet
            </p>
            <p className="text-xs font-medium">Not configured</p>
          </div>
        </div>
        <p className="mt-1.5 text-[10px] text-primary">Create wallet →</p>
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
      className="definn-card block p-2.5 transition-colors hover:border-primary/30"
      aria-label={`DEFINN Wallet ${statusLabel}`}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"
          aria-hidden="true"
        >
          <Wallet className="size-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            DEFINN Wallet
          </p>
          <p className="truncate font-mono text-xs font-medium">
            {truncateAddress(metadata.address)}
          </p>
        </div>
      </div>
      <p className={`mt-1.5 flex items-center gap-1 text-[10px] font-medium ${statusColor}`}>
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
