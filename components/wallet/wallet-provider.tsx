"use client";

import type { EthersWallet } from "@/lib/wallet/types";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { hasEncryptedKeystore } from "@/lib/wallet/storage";
import type { WalletMetadataResponse } from "@/lib/wallet/server";
import type { BlockchainStatus } from "@/lib/blockchain/types";

import { useBlockchainStatus } from "./use-blockchain-status";

type WalletContextValue = {
  metadata: WalletMetadataResponse;
  isUnlocked: boolean;
  hasLocalKeystore: boolean;
  hasWallet: boolean;
  blockchainStatus: BlockchainStatus | null;
  blockchainConnected: boolean;
  unlockWallet: (wallet: EthersWallet) => void;
  lockWallet: () => void;
  getUnlockedWallet: () => EthersWallet | null;
  setMetadata: (metadata: WalletMetadataResponse) => void;
  refreshLocalKeystore: () => void;
  refreshBlockchain: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

type WalletProviderProps = {
  userId: string;
  initialMetadata: WalletMetadataResponse;
  children: React.ReactNode;
};

export function WalletProvider({
  userId,
  initialMetadata,
  children,
}: WalletProviderProps) {
  const [metadata, setMetadata] = useState(initialMetadata);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasLocalKeystore, setHasLocalKeystore] = useState(() =>
    typeof window !== "undefined" ? hasEncryptedKeystore(userId) : false,
  );
  const walletRef = useRef<EthersWallet | null>(null);
  const { status: blockchainStatus, refresh: refreshBlockchain } =
    useBlockchainStatus();

  const refreshLocalKeystore = useCallback(() => {
    setHasLocalKeystore(hasEncryptedKeystore(userId));
  }, [userId]);

  const unlockWallet = useCallback((wallet: EthersWallet) => {
    walletRef.current = wallet;
    setIsUnlocked(true);
  }, []);

  const lockWallet = useCallback(() => {
    walletRef.current = null;
    setIsUnlocked(false);
  }, []);

  const getUnlockedWallet = useCallback(() => walletRef.current, []);

  const value = useMemo(
    () => ({
      metadata,
      isUnlocked,
      hasLocalKeystore,
      hasWallet: Boolean(metadata),
      blockchainStatus,
      blockchainConnected: blockchainStatus?.connected ?? false,
      unlockWallet,
      lockWallet,
      getUnlockedWallet,
      setMetadata,
      refreshLocalKeystore,
      refreshBlockchain,
    }),
    [
      metadata,
      isUnlocked,
      hasLocalKeystore,
      blockchainStatus,
      unlockWallet,
      lockWallet,
      getUnlockedWallet,
      refreshLocalKeystore,
      refreshBlockchain,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWalletContext(): WalletContextValue {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWalletContext must be used within WalletProvider");
  }

  return context;
}
