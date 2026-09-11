"use client";

import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createNewWallet } from "@/lib/wallet/create";
import type { EthersWallet } from "@/lib/wallet/types";
import { encryptWallet } from "@/lib/wallet/encrypt";
import {
  importWalletFromMnemonic,
  importWalletFromPrivateKey,
} from "@/lib/wallet/import";
import {
  registerWalletAddress,
  replaceWalletAddress,
} from "@/lib/wallet/actions";
import {
  saveEncryptedKeystore,
  removeEncryptedKeystore,
} from "@/lib/wallet/storage";
import { WalletError } from "@/lib/wallet/types";
import {
  importMnemonicSchema,
  importPrivateKeySchema,
  walletPasswordFormSchema,
} from "@/lib/validation/wallet";

import { useWalletContext } from "./wallet-provider";
import {
  WalletDetailsCard,
  WalletSecurityNotice,
} from "./wallet-details-card";
import { WalletUnlockForm } from "./wallet-unlock-form";
import { BlockchainActionsCard } from "./blockchain-actions-card";
import { BlockchainConnectivityCard } from "./blockchain-connectivity-card";

type WalletView =
  | "home"
  | "create-mnemonic"
  | "create-password"
  | "import"
  | "replace-confirm"
  | "unlock"
  | "error";

type WalletDashboardProps = {
  userId: string;
};

export function WalletDashboard({ userId }: WalletDashboardProps) {
  const {
    metadata,
    isUnlocked,
    hasLocalKeystore,
    unlockWallet,
    lockWallet,
    setMetadata,
    refreshLocalKeystore,
    blockchainConnected,
  } = useWalletContext();

  const [nativeBalance, setNativeBalance] = useState<string | null>(null);

  const [view, setView] = useState<WalletView>("home");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const [pendingMnemonic, setPendingMnemonic] = useState<string | null>(null);
  const [pendingWallet, setPendingWallet] = useState<EthersWallet | null>(null);
  const [mnemonicConfirmed, setMnemonicConfirmed] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [importMode, setImportMode] = useState<"mnemonic" | "privateKey">(
    "mnemonic",
  );
  const [importMnemonic, setImportMnemonic] = useState("");
  const [importPrivateKey, setImportPrivateKey] = useState("");
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);

  useEffect(() => {
    if (!metadata?.address) {
      return;
    }

    let active = true;

    const loadBalance = async () => {
      try {
        const response = await fetch("/api/blockchain/wallet-balance");
        const data = response.ok ? await response.json() : null;

        if (active) {
          setNativeBalance(
            data && typeof data.balance === "string"
              ? data.balance
              : "0.0000 ETH",
          );
        }
      } catch {
        if (active) {
          setNativeBalance(null);
        }
      }
    };

    void loadBalance();

    return () => {
      active = false;
    };
  }, [metadata?.address, blockchainConnected]);

  const resetForm = useCallback(() => {
    setPassword("");
    setConfirmPassword("");
    setFieldErrors({});
    setPendingMnemonic(null);
    setPendingWallet(null);
    setMnemonicConfirmed(false);
    setImportMnemonic("");
    setImportPrivateKey("");
    setReplaceConfirmed(false);
    setError(null);
  }, []);

  async function persistWallet(
    wallet: EthersWallet,
    walletPassword: string,
    isReplacement: boolean,
  ) {
    const encryptedJson = await encryptWallet(wallet, walletPassword);
    saveEncryptedKeystore(userId, encryptedJson);
    refreshLocalKeystore();

    const result = isReplacement
      ? await replaceWalletAddress(wallet.address, true)
      : await registerWalletAddress(wallet.address);

    if (!result.success) {
      removeEncryptedKeystore(userId);
      refreshLocalKeystore();
      throw new Error(result.error);
    }

    setMetadata({
      address: result.address,
      walletType: "DEFINN_CUSTOM",
      createdAt: new Date().toISOString(),
    });
    unlockWallet(wallet);
    resetForm();
    setView("home");
  }

  async function handleCreatePasswordSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = walletPasswordFormSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !errors[key]) {
          errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    if (!pendingWallet) {
      setError("Wallet session expired. Please start again.");
      return;
    }

    setIsPending(true);

    try {
      await persistWallet(
        pendingWallet,
        parsed.data.password,
        Boolean(metadata),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save wallet. Please try again.",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function handleImportSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    setIsPending(true);

    try {
      let wallet: EthersWallet;

      if (importMode === "mnemonic") {
        const parsed = importMnemonicSchema.safeParse({
          mnemonic: importMnemonic,
          password,
          confirmPassword,
        });

        if (!parsed.success) {
          const errors: Record<string, string> = {};
          for (const issue of parsed.error.issues) {
            const key = issue.path[0];
            if (typeof key === "string" && !errors[key]) {
              errors[key] = issue.message;
            }
          }
          setFieldErrors(errors);
          setIsPending(false);
          return;
        }

        wallet = importWalletFromMnemonic(parsed.data.mnemonic);

        if (metadata && !replaceConfirmed) {
          setPendingWallet(wallet);
          setView("replace-confirm");
          setIsPending(false);
          return;
        }

        await persistWallet(wallet, parsed.data.password, Boolean(metadata));
      } else {
        const parsed = importPrivateKeySchema.safeParse({
          privateKey: importPrivateKey,
          password,
          confirmPassword,
        });

        if (!parsed.success) {
          const errors: Record<string, string> = {};
          for (const issue of parsed.error.issues) {
            const key = issue.path[0];
            if (typeof key === "string" && !errors[key]) {
              errors[key] = issue.message;
            }
          }
          setFieldErrors(errors);
          setIsPending(false);
          return;
        }

        wallet = importWalletFromPrivateKey(parsed.data.privateKey);

        if (metadata && !replaceConfirmed) {
          setPendingWallet(wallet);
          setView("replace-confirm");
          setIsPending(false);
          return;
        }

        await persistWallet(wallet, parsed.data.password, Boolean(metadata));
      }
    } catch (caught) {
      if (caught instanceof WalletError) {
        setError(caught.message);
      } else if (caught instanceof Error) {
        setError(caught.message);
      } else {
        setError("Could not import wallet. Please try again.");
      }
    } finally {
      setIsPending(false);
    }
  }

  async function handleReplaceConfirm() {
    if (!pendingWallet || !replaceConfirmed) {
      setError("Please confirm wallet replacement to continue.");
      return;
    }

    const parsed = walletPasswordFormSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      setError("Set a wallet password before replacing.");
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      removeEncryptedKeystore(userId);
      await persistWallet(pendingWallet, parsed.data.password, true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not replace wallet. Please try again.",
      );
    } finally {
      setIsPending(false);
    }
  }

  function startCreate() {
    resetForm();
    const { mnemonic } = createNewWallet();
    const wallet = importWalletFromMnemonic(mnemonic);
    setPendingMnemonic(mnemonic);
    setPendingWallet(wallet);
    setView("create-mnemonic");
  }

  if (view === "create-mnemonic" && pendingMnemonic) {
    return (
      <>
        <PageHeader
          title="Save Your Recovery Phrase"
          description="Write down these 12 words in order. This is the only way to recover your wallet."
          badge="One-time display"
        />
        <WalletSecurityNotice />
        <SectionCard title="Recovery Phrase">
          <p className="mb-4 text-sm text-muted-foreground">
            Never share your recovery phrase. DEFINN does not store it in the
            database.
          </p>
          <div
            className="rounded-lg border bg-muted/40 p-4 font-mono text-sm leading-relaxed"
            aria-label="Recovery phrase"
          >
            {pendingMnemonic}
          </div>
          <label className="mt-4 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={mnemonicConfirmed}
              onChange={(event) => setMnemonicConfirmed(event.target.checked)}
              className="mt-1"
            />
            <span>
              I have written down my recovery phrase and understand that losing
              it means losing access to my wallet.
            </span>
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!mnemonicConfirmed}
              onClick={() => setView("create-password")}
            >
              Continue
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setView("home");
              }}
            >
              Cancel
            </Button>
          </div>
        </SectionCard>
      </>
    );
  }

  if (view === "create-password" && pendingWallet) {
    return (
      <>
        <PageHeader
          title="Protect Your Wallet"
          description="Create a wallet password to encrypt your wallet on this device."
        />
        <SectionCard title="Wallet Password">
          <form onSubmit={handleCreatePasswordSubmit} className="space-y-4" noValidate>
            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div className="space-y-2">
              <label htmlFor="wallet-password" className="text-sm font-medium">
                Wallet password
              </label>
              <Input
                id="wallet-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {fieldErrors.password ? (
                <p className="text-sm text-destructive">{fieldErrors.password}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="wallet-confirm" className="text-sm font-medium">
                Confirm wallet password
              </label>
              <Input
                id="wallet-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {fieldErrors.confirmPassword ? (
                <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
              ) : null}
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating wallet..." : "Create DEFINN Wallet"}
            </Button>
          </form>
        </SectionCard>
      </>
    );
  }

  if (view === "import") {
    return (
      <>
        <PageHeader
          title="Import Wallet"
          description="Restore a DEFINN wallet using your recovery phrase or private key."
        />
        <WalletSecurityNotice />
        <SectionCard title="Import">
          <div className="mb-4 flex gap-2">
            <Button
              type="button"
              variant={importMode === "mnemonic" ? "default" : "outline"}
              size="sm"
              onClick={() => setImportMode("mnemonic")}
            >
              Recovery phrase
            </Button>
            <Button
              type="button"
              variant={importMode === "privateKey" ? "default" : "outline"}
              size="sm"
              onClick={() => setImportMode("privateKey")}
            >
              Private key
            </Button>
          </div>
          <form onSubmit={handleImportSubmit} className="space-y-4" noValidate>
            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {importMode === "mnemonic" ? (
              <div className="space-y-2">
                <label htmlFor="import-mnemonic" className="text-sm font-medium">
                  Recovery phrase
                </label>
                <textarea
                  id="import-mnemonic"
                  className="min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                  value={importMnemonic}
                  onChange={(e) => setImportMnemonic(e.target.value)}
                  placeholder="Enter your 12 or 24 word recovery phrase"
                  required
                />
                {fieldErrors.mnemonic ? (
                  <p className="text-sm text-destructive">{fieldErrors.mnemonic}</p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="import-private-key" className="text-sm font-medium">
                  Private key
                </label>
                <Input
                  id="import-private-key"
                  type="password"
                  autoComplete="off"
                  value={importPrivateKey}
                  onChange={(e) => setImportPrivateKey(e.target.value)}
                  required
                />
                {fieldErrors.privateKey ? (
                  <p className="text-sm text-destructive">{fieldErrors.privateKey}</p>
                ) : null}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="import-password" className="text-sm font-medium">
                Wallet password
              </label>
              <Input
                id="import-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {fieldErrors.password ? (
                <p className="text-sm text-destructive">{fieldErrors.password}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="import-confirm" className="text-sm font-medium">
                Confirm wallet password
              </label>
              <Input
                id="import-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {fieldErrors.confirmPassword ? (
                <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Importing..." : "Import Wallet"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { resetForm(); setView("home"); }}>
                Cancel
              </Button>
            </div>
          </form>
        </SectionCard>
      </>
    );
  }

  if (view === "replace-confirm" && pendingWallet) {
    return (
      <>
        <PageHeader
          title="Replace Existing Wallet?"
          description="This will replace your registered wallet address and local encrypted data."
          badge="Confirmation required"
        />
        <SectionCard title="Confirm Replacement">
          <p className="text-sm text-muted-foreground">
            New address: <code className="font-mono text-xs">{pendingWallet.address}</code>
          </p>
          <label className="mt-4 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={replaceConfirmed}
              onChange={(e) => setReplaceConfirmed(e.target.checked)}
              className="mt-1"
            />
            <span>
              I understand this will replace my existing DEFINN wallet registration
              and I have backed up the new wallet recovery information.
            </span>
          </label>
          {error ? (
            <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!replaceConfirmed || isPending}
              onClick={handleReplaceConfirm}
            >
              {isPending ? "Replacing..." : "Replace Wallet"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setView("home");
              }}
            >
              Cancel
            </Button>
          </div>
        </SectionCard>
      </>
    );
  }

  if (view === "unlock" && metadata) {
    return (
      <>
        <PageHeader title="Unlock Wallet" description="Enter your wallet password to unlock." />
        <SectionCard title="Unlock">
          <WalletUnlockForm
            userId={userId}
            expectedAddress={metadata.address}
            onUnlocked={(wallet) => {
              unlockWallet(wallet);
              setView("home");
            }}
            onCancel={() => setView("home")}
          />
        </SectionCard>
      </>
    );
  }

  if (!metadata) {
    return (
      <>
        <PageHeader
          title="DEFINN Wallet"
          description="Create or import your custom simulation wallet. No MetaMask required."
          badge="Phase 5"
        />
        <WalletSecurityNotice />
        <SectionCard
          title="Get Started"
          description="Your wallet keys stay on this device in encrypted form. Only your public address is stored in PostgreSQL."
        >
          {error ? (
            <p className="mb-4 text-sm text-destructive" role="alert">{error}</p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={startCreate}>
              Create DEFINN Wallet
            </Button>
            <Button type="button" variant="outline" onClick={() => { resetForm(); setView("import"); }}>
              Import Existing Wallet
            </Button>
          </div>
        </SectionCard>
        <BlockchainConnectivityCard />
      </>
    );
  }

  if (!hasLocalKeystore) {
    return (
      <>
        <PageHeader
          title="DEFINN Wallet"
          description="Wallet registered, but encrypted data is not available on this device."
        />
        <WalletSecurityNotice />
        <SectionCard title="Recover on This Device">
          <p className="text-sm text-muted-foreground">
            Registered address:{" "}
            <code className="font-mono text-xs">{metadata.address}</code>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Import your wallet using your recovery phrase to restore encrypted
            storage on this browser.
          </p>
          <Button
            type="button"
            className="mt-4"
            onClick={() => { resetForm(); setView("import"); }}
          >
            Import Wallet
          </Button>
        </SectionCard>
        <BlockchainConnectivityCard walletAddress={metadata.address} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="DEFINN Wallet"
        description="Manage your custom simulation wallet with read-only local blockchain connectivity."
        badge={isUnlocked ? "Unlocked" : "Locked"}
      />
      <WalletSecurityNotice />
      <WalletDetailsCard
        address={metadata.address}
        isUnlocked={isUnlocked}
        nativeBalance={nativeBalance}
        blockchainConnected={blockchainConnected}
        onLock={lockWallet}
        onUnlock={() => setView("unlock")}
      />
      <BlockchainConnectivityCard walletAddress={metadata.address} />
      <BlockchainActionsCard />
      {isUnlocked ? (
        <SectionCard title="Wallet Management">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { resetForm(); setView("import"); }}
            >
              Import / Replace Wallet
            </Button>
          </div>
        </SectionCard>
      ) : null}
    </>
  );
}
