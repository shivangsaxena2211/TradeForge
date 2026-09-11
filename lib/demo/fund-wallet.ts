import { Contract, JsonRpcProvider, Wallet, parseEther } from "ethers";

import { getAnvilAdminPrivateKey } from "@/lib/blockchain/admin-key";
import {
  localContractAddresses,
  stockContractAbi,
  userContractAbi,
} from "@/lib/blockchain/contracts";

import {
  ANVIL_RPC_URL,
  DEMO_ETH_TARGET,
  DEMO_VIRTUAL_CASH_TARGET_PAISE,
  DEMO_WALLET_ADDRESS,
  EXPECTED_CHAIN_ID,
} from "./constants";

export type EthFundResult = {
  funded: boolean;
  balanceEth: string;
  txHash?: string;
  message: string;
};

export type VirtualCashFundResult = {
  registered: boolean;
  credited: boolean;
  balancePaise: bigint;
  message: string;
};

export type DemoFundResult = {
  eth: EthFundResult;
  virtualCash: VirtualCashFundResult;
};

function getProvider(): JsonRpcProvider {
  return new JsonRpcProvider(ANVIL_RPC_URL, EXPECTED_CHAIN_ID, {
    staticNetwork: true,
  });
}

export async function fundDemoWalletEth(
  walletAddress = DEMO_WALLET_ADDRESS,
): Promise<EthFundResult> {
  const provider = getProvider();
  const admin = new Wallet(getAnvilAdminPrivateKey(), provider);
  const targetWei = parseEther(DEMO_ETH_TARGET);
  const currentBalance = await provider.getBalance(walletAddress);

  if (currentBalance >= targetWei) {
    return {
      funded: false,
      balanceEth: formatEth(currentBalance),
      message: "Demo wallet already funded.",
    };
  }

  const amount = targetWei - currentBalance;
  const tx = await admin.sendTransaction({
    to: walletAddress,
    value: amount,
  });
  const receipt = await tx.wait();
  const finalBalance = await provider.getBalance(walletAddress);

  return {
    funded: true,
    balanceEth: formatEth(finalBalance),
    txHash: receipt?.hash,
    message: `Sent ${formatEth(amount)} ETH to demo wallet.`,
  };
}

export async function fundDemoVirtualCash(
  walletAddress = DEMO_WALLET_ADDRESS,
): Promise<VirtualCashFundResult> {
  const provider = getProvider();
  const admin = new Wallet(getAnvilAdminPrivateKey(), provider);

  const user = new Contract(
    localContractAddresses.user,
    userContractAbi,
    provider,
  );
  const stock = new Contract(
    localContractAddresses.stock,
    stockContractAbi,
    admin,
  );

  const registered = Boolean(await user.isRegistered(walletAddress));

  if (!registered) {
    return {
      registered: false,
      credited: false,
      balancePaise: BigInt(0),
      message:
        "DEFINN wallet is not registered on the fresh Anvil chain. Open the application, unlock the wallet and click Register on Blockchain. After registration, run: npm run demo:fund",
    };
  }

  const currentPaise = BigInt(
    (await stock.getVirtualCash(walletAddress)).toString(),
  );

  if (currentPaise >= DEMO_VIRTUAL_CASH_TARGET_PAISE) {
    return {
      registered: true,
      credited: false,
      balancePaise: currentPaise,
      message: "Demo virtual cash already at or above ₹100,000.",
    };
  }

  const topUp = DEMO_VIRTUAL_CASH_TARGET_PAISE - currentPaise;
  await stock.creditVirtualCash(walletAddress, topUp);

  const balancePaise = BigInt(
    (await stock.getVirtualCash(walletAddress)).toString(),
  );

  return {
    registered: true,
    credited: true,
    balancePaise,
    message: `Credited ₹${formatInrFromPaise(topUp)} virtual cash.`,
  };
}

export async function fundDemoAccount(
  walletAddress = DEMO_WALLET_ADDRESS,
): Promise<DemoFundResult> {
  const eth = await fundDemoWalletEth(walletAddress);
  const virtualCash = await fundDemoVirtualCash(walletAddress);

  return { eth, virtualCash };
}

export function formatEth(wei: bigint): string {
  const whole = wei / parseEther("1");
  const fraction = wei % parseEther("1");
  const fractionStr = fraction.toString().padStart(18, "0").slice(0, 4);
  return `${whole}.${fractionStr}`;
}

export function formatInrFromPaise(paise: bigint): string {
  const rupees = Number(paise) / 100;
  return rupees.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatInrBalanceFromPaise(paise: bigint): string {
  return `₹${formatInrFromPaise(paise)}`;
}
