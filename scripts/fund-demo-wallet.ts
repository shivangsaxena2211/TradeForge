import { config as loadEnv } from "dotenv";

loadEnv();
loadEnv({ path: ".env.local", override: true });

import { DEMO_WALLET_ADDRESS } from "../lib/demo/constants";
import {
  fundDemoAccount,
  formatInrBalanceFromPaise,
} from "../lib/demo/fund-wallet";

async function main() {
  const result = await fundDemoAccount(DEMO_WALLET_ADDRESS);

  console.log(result.eth.message);
  if (result.eth.txHash) {
    console.log(`ETH tx: ${result.eth.txHash}`);
  }
  console.log(`ETH balance: ${result.eth.balanceEth} ETH`);

  console.log(result.virtualCash.message);
  if (result.virtualCash.registered) {
    console.log(
      `Virtual cash: ${formatInrBalanceFromPaise(result.virtualCash.balancePaise)}`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
