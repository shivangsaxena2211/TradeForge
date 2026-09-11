"use client";

import { useCallback, useEffect, useState } from "react";

import {
  assertWalletAddressMatch,
  createConnectedSigner,
  executeContractTransaction,
  getHoldings,
  getSafeBlockchainErrorMessage,
  getUserContract,
  getVirtualCashFormatted,
  isUserRegistered,
  type HoldingSummary,
  type TransactionProgress,
} from "@/lib/blockchain/client";

import { useWalletContext } from "./wallet-provider";

type OnChainWalletState = {
  isRegistered: boolean | null;
  virtualCash: string | null;
  holdings: HoldingSummary[];
  isLoading: boolean;
  error: string | null;
  txProgress: TransactionProgress;
  lastTxHash: string | null;
  lastBlockNumber: number | null;
  refresh: () => Promise<void>;
  registerOnBlockchain: () => Promise<void>;
};

export function useOnChainWallet(): OnChainWalletState {
  const {
    metadata,
    isUnlocked,
    blockchainConnected,
    getUnlockedWallet,
  } = useWalletContext();

  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [virtualCash, setVirtualCash] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<HoldingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txProgress, setTxProgress] = useState<TransactionProgress>({
    status: "idle",
  });
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [lastBlockNumber, setLastBlockNumber] = useState<number | null>(null);

  const walletAddress = metadata?.address;

  const refresh = useCallback(async () => {
    if (!walletAddress || !blockchainConnected) {
      setIsRegistered(null);
      setVirtualCash(null);
      setHoldings([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const registered = await isUserRegistered(walletAddress);
      setIsRegistered(registered);

      if (registered) {
        const [cash, userHoldings] = await Promise.all([
          getVirtualCashFormatted(walletAddress),
          getHoldings(walletAddress),
        ]);
        setVirtualCash(cash);
        setHoldings(userHoldings);
      } else {
        setVirtualCash(null);
        setHoldings([]);
      }
    } catch (caught) {
      setError(getSafeBlockchainErrorMessage(caught));
      setIsRegistered(null);
      setVirtualCash(null);
      setHoldings([]);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, blockchainConnected]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!active) {
        return;
      }

      await refresh();
    };

    void load();

    return () => {
      active = false;
    };
  }, [refresh]);

  const registerOnBlockchain = useCallback(async () => {
    if (!walletAddress) {
      setError("No wallet registered to this account.");
      return;
    }

    if (!isUnlocked) {
      setError("Wallet is locked.");
      return;
    }

    if (!blockchainConnected) {
      setError("Blockchain is unavailable.");
      return;
    }

    const wallet = getUnlockedWallet();

    if (!wallet) {
      setError("Wallet is locked.");
      return;
    }

    try {
      assertWalletAddressMatch(walletAddress, wallet.address);
    } catch (caught) {
      setError(getSafeBlockchainErrorMessage(caught));
      return;
    }

    if (isRegistered) {
      setError(null);
      return;
    }

    setError(null);
    setTxProgress({ status: "confirming" });

    try {
      const signer = await createConnectedSigner(wallet);
      const alreadyRegistered = await isUserRegistered(
        signer.address,
        signer.provider!,
      );

      if (alreadyRegistered) {
        setIsRegistered(true);
        setTxProgress({ status: "idle" });
        await refresh();
        return;
      }

      const contract = getUserContract(signer);

      await executeContractTransaction(
        () => contract.register(),
        (progress) => {
          setTxProgress(progress);

          if (progress.status === "submitted") {
            setLastTxHash(progress.hash);
          }

          if (progress.status === "confirmed") {
            setLastTxHash(progress.hash);
            setLastBlockNumber(progress.blockNumber);
          }
        },
      );

      setTxProgress({ status: "idle" });
      await refresh();
    } catch (caught) {
      const message = getSafeBlockchainErrorMessage(caught);

      if (message !== "Transaction cancelled.") {
        setError(message);
      }

      setTxProgress(
        message === "Transaction cancelled."
          ? { status: "cancelled" }
          : { status: "error", message },
      );
    }
  }, [
    walletAddress,
    isUnlocked,
    blockchainConnected,
    getUnlockedWallet,
    isRegistered,
    refresh,
  ]);

  return {
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
  };
}
