"use client";

import { useCallback, useEffect, useState } from "react";

import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BlockchainStatus } from "@/lib/blockchain/types";
import { truncateAddress } from "@/lib/wallet/format";

type WalletBalanceResponse = {
  address: string;
  balance: string;
  connected: boolean;
  networkName: string;
  chainId: number | null;
};

type BlockchainConnectivityCardProps = {
  walletAddress?: string | null;
};

export function BlockchainConnectivityCard({
  walletAddress,
}: BlockchainConnectivityCardProps) {
  const [status, setStatus] = useState<BlockchainStatus | null>(null);
  const [balanceData, setBalanceData] = useState<WalletBalanceResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      const statusResponse = await fetch("/api/blockchain/status");
      const statusJson = (await statusResponse.json()) as BlockchainStatus;
      setStatus(statusJson);

      if (walletAddress) {
        const balanceResponse = await fetch("/api/blockchain/wallet-balance");

        if (balanceResponse.ok) {
          const balanceJson =
            (await balanceResponse.json()) as WalletBalanceResponse;
          setBalanceData(balanceJson);
        } else {
          setBalanceData(null);
        }
      } else {
        setBalanceData(null);
      }
    } catch {
      setStatus({
        connected: false,
        chainId: null,
        blockNumber: null,
        networkName: "DEFINN Local Network",
        rpcUrl: "http://127.0.0.1:8545",
        reason: "Could not reach the blockchain status endpoint.",
      });
      setBalanceData(null);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);

      try {
        const statusResponse = await fetch("/api/blockchain/status");
        const statusJson = (await statusResponse.json()) as BlockchainStatus;

        if (!active) {
          return;
        }

        setStatus(statusJson);

        if (walletAddress) {
          const balanceResponse = await fetch("/api/blockchain/wallet-balance");

          if (balanceResponse.ok) {
            const balanceJson =
              (await balanceResponse.json()) as WalletBalanceResponse;
            setBalanceData(balanceJson);
          } else {
            setBalanceData(null);
          }
        } else {
          setBalanceData(null);
        }
      } catch {
        if (active) {
          setStatus({
            connected: false,
            chainId: null,
            blockNumber: null,
            networkName: "DEFINN Local Network",
            rpcUrl: "http://127.0.0.1:8545",
            reason: "Could not reach the blockchain status endpoint.",
          });
          setBalanceData(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [walletAddress]);

  const connected = status?.connected ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blockchain Connection</CardTitle>
        <CardDescription>
          Read-only connectivity to the local Anvil development network. No
          transactions are sent in this phase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
          <div>
            <p className="text-sm font-medium">Status</p>
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Checking..."
                : connected
                  ? "Connected"
                  : "Disconnected"}
            </p>
          </div>
          <StatusBadge
            status={connected ? "Connected" : "Disconnected"}
          />
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <dt className="text-muted-foreground">Network</dt>
            <dd className="mt-1 font-medium">
              {status?.networkName ?? "DEFINN Local Network"}
            </dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-muted-foreground">Chain ID</dt>
            <dd className="mt-1 font-medium">
              {status?.chainId ?? "—"}
            </dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-muted-foreground">Latest Block</dt>
            <dd className="mt-1 font-medium">
              {status?.blockNumber ?? "—"}
            </dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-muted-foreground">RPC</dt>
            <dd className="mt-1 text-xs text-muted-foreground">
              Local development network
            </dd>
          </div>
        </dl>

        {!connected && status?.reason ? (
          <p className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
            {status.reason}
            <br />
            <span className="mt-2 inline-block font-medium text-foreground">
              Start the DEFINN local blockchain:{" "}
              <code className="font-mono text-xs">npm run blockchain:start</code>
            </span>
          </p>
        ) : null}

        {walletAddress ? (
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">Wallet Blockchain Balance</p>
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Address</dt>
                <dd className="mt-1 font-mono text-xs break-all">
                  {walletAddress}
                  <span className="ml-2 text-muted-foreground">
                    ({truncateAddress(walletAddress)})
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Native Balance</dt>
                <dd className="mt-1 font-medium">
                  {balanceData?.balance ?? (isLoading ? "Loading..." : "0.0000 ETH")}
                </dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">
              This is test ETH on the local Anvil chain — not real cryptocurrency
              and not your DEFINN virtual stock-trading balance. Anvil
              pre-funded development accounts are separate from your DEFINN
              wallet.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Create or import a DEFINN wallet to query its address balance on the
            local chain.
          </p>
        )}

        <button
          type="button"
          onClick={() => void loadData()}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Refresh connection
        </button>
      </CardContent>
    </Card>
  );
}
