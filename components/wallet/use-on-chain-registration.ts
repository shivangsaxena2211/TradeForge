"use client";

import { useEffect, useState } from "react";

import { isUserRegistered } from "@/lib/blockchain/client";

import { useWalletContext } from "./wallet-provider";

export function useOnChainRegistration(): boolean | null {
  const { metadata, blockchainConnected } = useWalletContext();
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!metadata?.address || !blockchainConnected) {
        if (active) {
          setIsRegistered(null);
        }
        return;
      }

      try {
        const registered = await isUserRegistered(metadata.address);

        if (active) {
          setIsRegistered(registered);
        }
      } catch {
        if (active) {
          setIsRegistered(null);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [metadata, blockchainConnected]);

  return isRegistered;
}
