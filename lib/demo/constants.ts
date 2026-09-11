export const DEMO_WALLET_ADDRESS =
  "0xc472804a9025F1da56e9Ed6d08bBC97230b6B189";

/** Target demo balance: ₹100,000 expressed in paise (100 paise = ₹1). */
export const DEMO_VIRTUAL_CASH_TARGET_PAISE = BigInt(10_000_000);

/** Target demo ETH balance for gas on local Anvil. */
export const DEMO_ETH_TARGET = "0.1";

export const ANVIL_HOST = "127.0.0.1";
export const ANVIL_PORT = 8545;
export const ANVIL_RPC_URL = `http://${ANVIL_HOST}:${ANVIL_PORT}`;
export const EXPECTED_CHAIN_ID = 31337;
