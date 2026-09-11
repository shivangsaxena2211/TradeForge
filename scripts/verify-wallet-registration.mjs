import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const addresses = JSON.parse(
  readFileSync(join(root, "lib/blockchain/contracts/addresses.local.json"), "utf8"),
);
const userAbi = JSON.parse(
  readFileSync(join(root, "lib/blockchain/contracts/abis/User.json"), "utf8"),
).abi;

const RPC_URL = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL ?? "http://127.0.0.1:8545";
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "31337");

// Standard Anvil dev account #3 — not committed as a secret; development-only.
const TEST_PRIVATE_KEY =
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";

async function main() {
  const provider = new JsonRpcProvider(RPC_URL, CHAIN_ID, {
    staticNetwork: true,
  });
  const wallet = new Wallet(TEST_PRIVATE_KEY, provider);
  const userContract = new Contract(addresses.user, userAbi, wallet);

  const alreadyRegistered = await userContract.isRegistered(wallet.address);

  if (alreadyRegistered) {
    console.log(
      JSON.stringify({
        status: "already_registered",
        address: wallet.address,
      }),
    );
    return;
  }

  const response = await userContract.register();
  console.log(
    JSON.stringify({
      status: "submitted",
      hash: response.hash,
      address: wallet.address,
    }),
  );

  const receipt = await response.wait();

  console.log(
    JSON.stringify({
      status: "confirmed",
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      address: wallet.address,
    }),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
