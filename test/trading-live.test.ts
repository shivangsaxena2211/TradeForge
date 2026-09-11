import "dotenv/config";

import { Contract, HDNodeWallet, JsonRpcProvider, Wallet } from "ethers";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getPrismaClient } from "@/lib/db/client";
import {
  localContractAddresses,
  stockContractAbi,
  userContractAbi,
} from "@/lib/blockchain/contracts";
import { getClientBlockchainConfig } from "@/lib/blockchain/client/config";
import { parseTradeExecutedFromReceipt } from "@/lib/trading/events";
import { shareInputToUnits } from "@/lib/trading/precision";
import { runOnChainStockSetup } from "@/lib/blockchain/run-on-chain-stock-setup";
import {
  createPendingOrder,
  syncOrderFromTransaction,
} from "@/lib/trading/service";

const TRADE_SYMBOL = "RELIANCE";

const ADMIN_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const ANVIL_MNEMONIC =
  "test test test test test test test test test test test junk";

let anvilAvailable = false;

beforeAll(async () => {
  try {
    const config = getClientBlockchainConfig();
    const provider = new JsonRpcProvider(config.rpcUrl, config.chainId, {
      staticNetwork: true,
    });
    await provider.getBlockNumber();
    anvilAvailable = true;
  } catch {
    anvilAvailable = false;
  }
});

describe("live Anvil trading", () => {
  it("executes BUY and SELL with PostgreSQL sync", async () => {
    if (!anvilAvailable || !process.env.DATABASE_URL) {
      return;
    }

    const config = getClientBlockchainConfig();
    const provider = new JsonRpcProvider(config.rpcUrl, config.chainId, {
      staticNetwork: true,
    });
    const admin = new Wallet(ADMIN_PRIVATE_KEY, provider);
    const trader = HDNodeWallet.fromPhrase(
      ANVIL_MNEMONIC,
      undefined,
      "m/44'/60'/0'/0/1",
    ).connect(provider);

    const stock = new Contract(
      localContractAddresses.stock,
      stockContractAbi,
      admin,
    );
    const user = new Contract(
      localContractAddresses.user,
      userContractAbi,
      trader,
    );
    const stockTrader = stock.connect(trader) as Contract;

    const prisma = getPrismaClient();
    const dbUser = await prisma.user.upsert({
      where: { email: "live-trader@definn.local" },
      update: {},
      create: {
        email: "live-trader@definn.local",
        username: "live-trader",
        passwordHash: "test-only",
      },
    });

    await prisma.wallet.upsert({
      where: { userId: dbUser.id },
      update: { address: trader.address },
      create: {
        userId: dbUser.id,
        address: trader.address,
      },
    });

    let dbStock = await prisma.stock.findUnique({
      where: {
        exchange_symbol: {
          exchange: "NSE",
          symbol: TRADE_SYMBOL,
        },
      },
    });

    if (!dbStock?.onChainStockId) {
      await runOnChainStockSetup(prisma, stock);
      dbStock = await prisma.stock.findUnique({
        where: {
          exchange_symbol: {
            exchange: "NSE",
            symbol: TRADE_SYMBOL,
          },
        },
      });
    }

    if (!dbStock?.onChainStockId) {
      throw new Error(`Missing on-chain mapping for ${TRADE_SYMBOL}.`);
    }

    if (!(await user.isRegistered(trader.address))) {
      await (await user.register()).wait();
    }

    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        await stock.creditVirtualCash(trader.address, BigInt(10_000_000));
        break;
      } catch (error) {
        if (attempt === 3) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }

    const quantityUnits = shareInputToUnits("1");
    expect(quantityUnits).not.toBeNull();

    const onChainStock = await stock.getStock(BigInt(dbStock.onChainStockId));
    const pricePaise = BigInt(onChainStock.price.toString());
    const onChainStockId = dbStock.onChainStockId;

    const buyOrder = await createPendingOrder(
      dbUser.id,
      TRADE_SYMBOL,
      "BUY",
      quantityUnits!,
      onChainStockId,
      pricePaise,
    );

    if (!buyOrder.success) {
      throw new Error(buyOrder.error);
    }

    const buyTx = await stockTrader.buy(onChainStockId, quantityUnits);
    const buyReceipt = await buyTx.wait();
    const buyEvent = parseTradeExecutedFromReceipt(buyReceipt);

    expect(buyEvent?.side).toBe("BUY");
    expect(buyReceipt?.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    const buySync = await syncOrderFromTransaction(
      dbUser.id,
      buyOrder.orderId,
      buyReceipt!.hash,
    );

    expect(buySync.success).toBe(true);

    const holdingAfterBuy = await stock.getHolding(trader.address, onChainStockId);
    expect(BigInt(holdingAfterBuy.toString())).toBe(quantityUnits);

    const sellOrder = await createPendingOrder(
      dbUser.id,
      TRADE_SYMBOL,
      "SELL",
      quantityUnits!,
      onChainStockId,
      pricePaise,
    );

    if (!sellOrder.success) {
      throw new Error(sellOrder.error);
    }

    const sellTx = await stockTrader.sell(onChainStockId, quantityUnits);
    const sellReceipt = await sellTx.wait();
    const sellEvent = parseTradeExecutedFromReceipt(sellReceipt);

    expect(sellEvent?.side).toBe("SELL");

    const sellSync = await syncOrderFromTransaction(
      dbUser.id,
      sellOrder.orderId,
      sellReceipt!.hash,
    );

    expect(sellSync.success).toBe(true);

    const holdingAfterSell = await stock.getHolding(trader.address, onChainStockId);
    expect(BigInt(holdingAfterSell.toString())).toBe(BigInt(0));

    console.log("BUY tx:", buyReceipt!.hash, "block", buyReceipt!.blockNumber);
    console.log("SELL tx:", sellReceipt!.hash, "block", sellReceipt!.blockNumber);
  }, 120_000);
});
