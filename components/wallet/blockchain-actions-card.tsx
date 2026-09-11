"use client";

import { Link2, RefreshCw } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { truncateAddress } from "@/lib/wallet/format";

import { useOnChainWallet } from "./use-on-chain-wallet";
import { useWalletContext } from "./wallet-provider";

export function BlockchainActionsCard() {
  const { metadata, isUnlocked, blockchainConnected } = useWalletContext();
  const {
    isRegistered,
    virtualCash,
    holdings,
    isLoading,
    error,
    txProgress,
    lastTxHash,
    lastBlockNumber,
    refresh,
    registerOnBlockchain,
  } = useOnChainWallet();

  const isRegistering =
    txProgress.status === "confirming" || txProgress.status === "submitted";

  let registrationLabel = "Unknown";

  if (!blockchainConnected) {
    registrationLabel = "Unavailable";
  } else if (isLoading && isRegistered === null) {
    registrationLabel = "Checking...";
  } else if (isRegistered) {
    registrationLabel = "Registered";
  } else {
    registrationLabel = "Not registered";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-4" aria-hidden="true" />
          Blockchain Wallet Actions
        </CardTitle>
        <CardDescription>
          Register your DEFINN wallet on the local smart-contract layer. Signing
          happens in your browser — private keys never leave this device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!blockchainConnected ? (
          <p className="text-sm text-muted-foreground">
            Start the DEFINN local blockchain to enable on-chain wallet actions.
          </p>
        ) : null}

        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
          <div>
            <p className="text-sm font-medium">On-chain registration</p>
            <p className="text-sm text-muted-foreground">{registrationLabel}</p>
          </div>
          <StatusBadge
            status={
              isRegistered
                ? "Registered"
                : blockchainConnected
                  ? "Not registered"
                  : "Offline"
            }
          />
        </div>

        {metadata ? (
          <p className="text-sm text-muted-foreground">
            Wallet address:{" "}
            <code className="font-mono text-xs">
              {truncateAddress(metadata.address)}
            </code>
          </p>
        ) : null}

        {error ? (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {txProgress.status === "confirming" ? (
          <p className="text-sm text-muted-foreground">
            Confirming transaction...
          </p>
        ) : null}

        {txProgress.status === "submitted" && lastTxHash ? (
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium">Transaction submitted</p>
            <p className="mt-1 text-muted-foreground">
              Tx Hash: <code className="font-mono text-xs break-all">{lastTxHash}</code>
            </p>
          </div>
        ) : null}

        {txProgress.status === "confirmed" && lastTxHash ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
            <p className="font-medium text-emerald-700 dark:text-emerald-300">
              Transaction confirmed
            </p>
            <p className="mt-1 text-muted-foreground">
              Tx Hash: <code className="font-mono text-xs break-all">{lastTxHash}</code>
            </p>
            {lastBlockNumber !== null ? (
              <p className="mt-1 text-muted-foreground">Block: {lastBlockNumber}</p>
            ) : null}
          </div>
        ) : null}

        {txProgress.status === "cancelled" ? (
          <p className="text-sm text-muted-foreground">Transaction cancelled.</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={
              !blockchainConnected ||
              !isUnlocked ||
              isRegistering ||
              isRegistered === true
            }
            onClick={() => void registerOnBlockchain()}
          >
            {isRegistered
              ? "Wallet already registered"
              : isRegistering
                ? "Registering..."
                : "Register Wallet on Blockchain"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!blockchainConnected || isLoading}
            onClick={() => void refresh()}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Refresh
          </Button>
        </div>

        {!isUnlocked && blockchainConnected ? (
          <p className="text-sm text-muted-foreground">
            Unlock your wallet to register on the blockchain.
          </p>
        ) : null}

        {isRegistered ? (
          <div className="space-y-4 border-t pt-4">
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium">Virtual Cash (simulated)</p>
              <p className="mt-1 text-lg font-semibold">
                {virtualCash ?? "Loading..."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Simulated stock-trading capital on-chain. Not ETH or real INR.
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium">Blockchain Holdings</p>
              {holdings.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No on-chain holdings yet.
                </p>
              ) : (
                <ul className="mt-2 space-y-2 text-sm">
                  {holdings.map((holding) => (
                    <li
                      key={holding.stockId}
                      className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2"
                    >
                      <span>
                        {holding.symbol}{" "}
                        <span className="text-muted-foreground">
                          ({holding.name})
                        </span>
                      </span>
                      <span className="font-mono text-xs">
                        {holding.quantityFormatted} shares
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
