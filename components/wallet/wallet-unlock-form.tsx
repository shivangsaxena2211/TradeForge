"use client";

import type { EthersWallet } from "@/lib/wallet/types";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { decryptWallet } from "@/lib/wallet/encrypt";
import { loadEncryptedKeystore } from "@/lib/wallet/storage";
import { WalletError } from "@/lib/wallet/types";
import { unlockWalletSchema } from "@/lib/validation/wallet";

type WalletUnlockFormProps = {
  userId: string;
  expectedAddress: string;
  onUnlocked: (wallet: EthersWallet) => void;
  onCancel?: () => void;
};

export function WalletUnlockForm({
  userId,
  expectedAddress,
  onUnlocked,
  onCancel,
}: WalletUnlockFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = unlockWalletSchema.safeParse({ password });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }

    const encryptedJson = loadEncryptedKeystore(userId);

    if (!encryptedJson) {
      setError(
        "Encrypted wallet not found on this device. Import your wallet using your recovery phrase.",
      );
      return;
    }

    setIsPending(true);

    try {
      const wallet = await decryptWallet(encryptedJson, parsed.data.password);

      if (wallet.address.toLowerCase() !== expectedAddress.toLowerCase()) {
        setError(
          "Wallet data does not match the registered address. Try importing with your recovery phrase.",
        );
        return;
      }

      onUnlocked(wallet);
    } catch (caught) {
      if (caught instanceof WalletError) {
        setError(caught.message);
      } else {
        setError("Could not unlock wallet. Please try again.");
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="unlock-password" className="text-sm font-medium">
          Wallet password
        </label>
        <Input
          id="unlock-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Unlocking..." : "Unlock"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
