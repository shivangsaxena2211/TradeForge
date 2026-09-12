"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatInr } from "@/lib/format/currency";
import {
  formatShareQuantity,
  formatVirtualCashFromUnits,
  getHoldingUnits,
  getOnChainStockQuoteById,
  getVirtualCashUnits,
  isUserRegistered,
} from "@/lib/blockchain/client";
import { assertWalletAddressMatch } from "@/lib/blockchain/client/address";
import { getClientBlockchainConfig } from "@/lib/blockchain/client/config";
import { validateChainId } from "@/lib/blockchain/client/chain";
import { getClientProvider } from "@/lib/blockchain/client/provider";
import {
  computeTradeValuePaise,
  paiseToInrString,
  validateBuyPreTradeUx,
  validateSellPreTradeUx,
  validateTradeQuantityInput,
  executeMarketTrade,
  type TradeExecutionProgress,
  type TradeSide,
} from "@/lib/trading";
import { truncateAddress } from "@/lib/wallet/format";

import { useOnChainWallet } from "@/components/wallet/use-on-chain-wallet";
import { useWalletContext } from "@/components/wallet/wallet-provider";

type TradePanelProps = {
  symbol: string;
  marketPriceInr: number;
  isActiveInDatabase: boolean;
  onChainStockId: number | null;
};

type TradeUiState =
  | "idle"
  | "confirming"
  | "signing"
  | "submitted"
  | "waiting"
  | "confirmed"
  | "cancelled"
  | "failed";

export function TradePanel({
  symbol,
  marketPriceInr,
  isActiveInDatabase,
  onChainStockId,
}: TradePanelProps) {
  const {
    metadata,
    isUnlocked,
    blockchainConnected,
    getUnlockedWallet,
  } = useWalletContext();
  const { isRegistered, refresh: refreshOnChain } = useOnChainWallet();

  const [side, setSide] = useState<TradeSide>("BUY");
  const [quantityInput, setQuantityInput] = useState("1");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [uiState, setUiState] = useState<TradeUiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);

  const [onChainStock, setOnChainStock] = useState<Awaited<
    ReturnType<typeof getOnChainStockQuoteById>
  > | null>(null);
  const [virtualCashPaise, setVirtualCashPaise] = useState<bigint | null>(null);
  const [holdingUnits, setHoldingUnits] = useState<bigint | null>(null);
  const [isLoadingChain, setIsLoadingChain] = useState(false);

  const mappingConfigured = onChainStockId !== null;

  const quantityValidation = useMemo(
    () => validateTradeQuantityInput(quantityInput),
    [quantityInput],
  );

  const quantityUnits = quantityValidation.valid
    ? quantityValidation.quantityUnits
    : null;

  const estimatedTotalPaise = useMemo(() => {
    if (!onChainStock || !quantityUnits) {
      return null;
    }

    return computeTradeValuePaise(onChainStock.pricePaise, quantityUnits);
  }, [onChainStock, quantityUnits]);

  const loadOnChainState = useCallback(async () => {
    if (!mappingConfigured || !metadata?.address || !blockchainConnected) {
      setOnChainStock(null);
      setVirtualCashPaise(null);
      setHoldingUnits(null);
      return;
    }

    setIsLoadingChain(true);
    setError(null);

    try {
      const stock = await getOnChainStockQuoteById(onChainStockId);
      setOnChainStock(stock);

      if (stock) {
        const [cash, holding] = await Promise.all([
          getVirtualCashUnits(metadata.address),
          getHoldingUnits(metadata.address, stock.stockId),
        ]);
        setVirtualCashPaise(cash);
        setHoldingUnits(holding);
      } else {
        setVirtualCashPaise(null);
        setHoldingUnits(null);
      }
    } catch {
      setError("Blockchain is unavailable.");
    } finally {
      setIsLoadingChain(false);
    }
  }, [metadata, blockchainConnected, onChainStockId, mappingConfigured]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!active) {
        return;
      }

      await loadOnChainState();
    };

    void load();

    return () => {
      active = false;
    };
  }, [loadOnChainState]);

  async function validatePreTrade(): Promise<string | null> {
    if (!mappingConfigured) {
      return "Blockchain trading is not configured for this stock.";
    }

    if (!metadata?.address) {
      return "DEFINN wallet is not registered.";
    }

    if (!isUnlocked) {
      return "Wallet is locked.";
    }

    if (!blockchainConnected) {
      return "Blockchain is unavailable.";
    }

    try {
      await validateChainId(getClientProvider());
    } catch {
      return "Wrong blockchain network.";
    }

    const wallet = getUnlockedWallet();

    if (!wallet) {
      return "Wallet is locked.";
    }

    try {
      assertWalletAddressMatch(metadata.address, wallet.address);
    } catch (caught) {
      return caught instanceof Error ? caught.message : "Wallet address mismatch.";
    }

    const registered = await isUserRegistered(wallet.address);

    if (!registered) {
      return "Wallet is not registered on the blockchain.";
    }

    if (!isActiveInDatabase) {
      return "Stock is inactive.";
    }

    if (!quantityValidation.valid) {
      return quantityValidation.message;
    }

    if (!onChainStock || !quantityUnits || estimatedTotalPaise === null) {
      return "Blockchain is unavailable.";
    }

    if (onChainStock.stockId !== onChainStockId) {
      return "On-chain stock mapping mismatch for this symbol.";
    }

    if (virtualCashPaise === null || holdingUnits === null) {
      return "Unable to read on-chain balances.";
    }

    if (side === "BUY") {
      return validateBuyPreTradeUx(
        onChainStock,
        quantityUnits,
        virtualCashPaise,
        estimatedTotalPaise,
      );
    }

    return validateSellPreTradeUx(onChainStock, quantityUnits, holdingUnits);
  }

  async function handleConfirmTrade() {
    setError(null);
    setSyncWarning(null);
    setTxHash(null);
    setBlockNumber(null);

    const validationError = await validatePreTrade();

    if (validationError) {
      setError(validationError);
      return;
    }

    const wallet = getUnlockedWallet();

    if (!wallet || !metadata?.address || !onChainStock || !quantityUnits || onChainStockId === null) {
      setError("Trading prerequisites are not met.");
      return;
    }

    setUiState("confirming");

    let orderId: string | null = null;

    try {
      const createResponse = await fetch("/api/trading/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          side,
          quantity: quantityInput,
          onChainStockId,
          requestedPricePaise: onChainStock.pricePaise.toString(),
          quantityUnits: quantityUnits.toString(),
        }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createData.error ?? "Unable to create order.");
      }

      orderId = createData.orderId;

      const receipt = await executeMarketTrade(
        wallet,
        metadata.address,
        onChainStockId,
        side,
        quantityUnits,
        (progress: TradeExecutionProgress) => {
          if (progress.status === "confirming") {
            setUiState("confirming");
          }

          if (progress.status === "signing") {
            setUiState("signing");
          }

          if (progress.status === "submitted") {
            setUiState("submitted");
            setTxHash(progress.hash);
          }

          if (progress.status === "confirmed") {
            setUiState("waiting");
            setTxHash(progress.hash);
            setBlockNumber(progress.blockNumber);
          }

          if (progress.status === "cancelled") {
            setUiState("cancelled");
          }

          if (progress.status === "error") {
            setUiState("failed");
            setError(progress.message);
          }
        },
      );

      setUiState("waiting");
      setTxHash(receipt.hash);
      setBlockNumber(receipt.blockNumber);

      const syncResponse = await fetch(`/api/trading/orders/${orderId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: receipt.hash }),
      });

      const syncData = await syncResponse.json();

      if (!syncResponse.ok) {
        setSyncWarning(
          syncData.error ??
            "Blockchain trade succeeded, but application sync failed. Retry with the same transaction hash.",
        );

        if (syncData.blockchainSucceeded) {
          setUiState("confirmed");
        } else {
          setUiState("failed");
          setError(syncData.error ?? "Synchronization failed.");
        }

        return;
      }

      setUiState("confirmed");
      setShowConfirmation(false);
      await loadOnChainState();
      await refreshOnChain();
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Trade failed.";

      if (message === "Transaction cancelled.") {
        setUiState("cancelled");

        if (orderId) {
          await fetch(`/api/trading/orders/${orderId}/cancel`, {
            method: "POST",
          });
        }
      } else {
        setUiState("failed");
        setError(message);
      }
    }
  }

  const config = getClientBlockchainConfig();

  if (!mappingConfigured) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
        Blockchain trading is not configured for this stock. Run{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run trading:setup-on-chain</code>{" "}
        after seeding the stock universe.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className="grid flex-1 grid-cols-2 gap-1 rounded-lg border border-border/50 bg-surface-inset p-1"
          role="group"
          aria-label="Trade side"
        >
          <Button
            type="button"
            size="sm"
            variant={side === "BUY" ? "default" : "ghost"}
            className={side === "BUY" ? "bg-success/90 hover:bg-success/80" : ""}
            onClick={() => {
              setSide("BUY");
              setShowConfirmation(false);
              setUiState("idle");
              setError(null);
            }}
          >
            BUY
          </Button>
          <Button
            type="button"
            size="sm"
            variant={side === "SELL" ? "default" : "ghost"}
            className={side === "SELL" ? "bg-destructive hover:bg-destructive/90" : ""}
            onClick={() => {
              setSide("SELL");
              setShowConfirmation(false);
              setUiState("idle");
              setError(null);
            }}
          >
            SELL
          </Button>
        </div>
        <StatusBadge status="Market Order" />
      </div>

      <div className="grid gap-2 rounded-lg border border-border/40 bg-surface-inset p-3 text-xs md:grid-cols-2">
        <div>
          <p className="text-muted-foreground">Simulated Market Price (PostgreSQL)</p>
          <p className="font-medium">{formatInr(marketPriceInr)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">On-chain Execution Price</p>
          <p className="font-medium">
            {onChainStock ? formatInr(Number(onChainStock.priceInr)) : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">On-chain Virtual Cash</p>
          <p className="font-medium">
            {virtualCashPaise !== null
              ? formatVirtualCashFromUnits(virtualCashPaise)
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">On-chain Holding</p>
          <p className="font-medium">
            {holdingUnits !== null
              ? `${formatShareQuantity(holdingUnits)} shares`
              : "—"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="trade-quantity" className="text-sm font-medium">
          Quantity (shares)
        </label>
        <Input
          id="trade-quantity"
          type="text"
          inputMode="decimal"
          value={quantityInput}
          onChange={(event) => setQuantityInput(event.target.value)}
          disabled={uiState !== "idle" && uiState !== "failed" && uiState !== "cancelled"}
        />
        {!quantityValidation.valid ? (
          <p className="text-sm text-destructive">{quantityValidation.message}</p>
        ) : null}
      </div>

      {estimatedTotalPaise !== null ? (
        <p className="text-sm text-muted-foreground">
          Estimated {side === "BUY" ? "cost" : "proceeds"}:{" "}
          <span className="font-medium text-foreground">
            {formatInr(Number(paiseToInrString(estimatedTotalPaise)))}
          </span>
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {syncWarning ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200" role="alert">
          {syncWarning}
        </p>
      ) : null}

      {uiState === "confirming" ? (
        <p className="text-sm text-muted-foreground">Confirming transaction...</p>
      ) : null}
      {uiState === "signing" ? (
        <p className="text-sm text-muted-foreground">Wallet signing...</p>
      ) : null}
      {uiState === "submitted" || uiState === "waiting" ? (
        <p className="text-sm text-muted-foreground">
          Transaction submitted. Waiting for confirmation...
        </p>
      ) : null}
      {uiState === "cancelled" ? (
        <p className="text-sm text-muted-foreground">Transaction cancelled.</p>
      ) : null}
      {txHash ? (
        <div className="rounded-lg border p-3 text-sm">
          <p className="font-medium">
            {uiState === "confirmed" ? "Transaction confirmed" : "Transaction hash"}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
            <code className="font-mono text-xs break-all">{txHash}</code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(txHash)}
            >
              <Copy className="size-3.5" aria-hidden="true" />
              Copy
            </Button>
          </p>
          {blockNumber !== null ? (
            <p className="mt-1 text-muted-foreground">Block: {blockNumber}</p>
          ) : null}
        </div>
      ) : null}

      {!showConfirmation ? (
        <Button
          type="button"
          disabled={
            isLoadingChain ||
            !blockchainConnected ||
            !isUnlocked ||
            isRegistered === false ||
            (uiState !== "idle" && uiState !== "failed" && uiState !== "cancelled")
          }
          onClick={async () => {
            const validationError = await validatePreTrade();

            if (validationError) {
              setError(validationError);
              return;
            }

            setError(null);
            setShowConfirmation(true);
          }}
        >
          Review {side} Order
        </Button>
      ) : (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="font-medium">{side} {symbol}</p>
          <dl className="grid gap-2 text-sm md:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Order Type</dt>
              <dd>Market</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Quantity</dt>
              <dd>{quantityInput} shares</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">On-chain Price</dt>
              <dd>
                {onChainStock
                  ? formatInr(Number(onChainStock.priceInr))
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Estimated Total</dt>
              <dd>
                {estimatedTotalPaise
                  ? formatInr(Number(paiseToInrString(estimatedTotalPaise)))
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Wallet</dt>
              <dd className="font-mono text-xs">
                {metadata ? truncateAddress(metadata.address) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Network</dt>
              <dd>{config.networkName}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void handleConfirmTrade()}
              disabled={uiState === "confirming" || uiState === "signing" || uiState === "submitted" || uiState === "waiting"}
            >
              Confirm {side}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmation(false)}
            >
              Back
            </Button>
          </div>
        </div>
      )}

      {!isUnlocked ? (
        <p className="text-sm text-muted-foreground">
          Unlock your DEFINN wallet to trade on-chain.
        </p>
      ) : null}

      {isRegistered === false ? (
        <p className="text-sm text-muted-foreground">
          Register your wallet on the blockchain before trading.
        </p>
      ) : null}
    </div>
  );
}
