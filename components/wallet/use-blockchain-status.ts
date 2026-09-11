"use client";

import { useCallback, useEffect, useState } from "react";

import type { BlockchainStatus } from "@/lib/blockchain/types";

export function useBlockchainStatus(pollMs = 30_000) {
  const [status, setStatus] = useState<BlockchainStatus | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/blockchain/status");
      const json = (await response.json()) as BlockchainStatus;
      setStatus(json);
    } catch {
      setStatus({
        connected: false,
        chainId: null,
        blockNumber: null,
        networkName: "DEFINN Local Network",
        rpcUrl: "http://127.0.0.1:8545",
        reason: "Offline",
      });
    }
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch("/api/blockchain/status");
        const json = (await response.json()) as BlockchainStatus;
        if (active) {
          setStatus(json);
        }
      } catch {
        if (active) {
          setStatus({
            connected: false,
            chainId: null,
            blockNumber: null,
            networkName: "DEFINN Local Network",
            rpcUrl: "http://127.0.0.1:8545",
            reason: "Offline",
          });
        }
      }
    };

    void load();
    const interval = setInterval(() => {
      void load();
    }, pollMs);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [pollMs]);

  return { status, refresh };
}
