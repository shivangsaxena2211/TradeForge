/**
 * Centralized blockchain configuration for DEFINN local development.
 * Values are read from environment variables — never hardcode in components.
 */
export const blockchainConfig = {
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL ?? "http://127.0.0.1:8545",
  chainId: Number(process.env.CHAIN_ID ?? "31337"),
  networkName: "DEFINN Local Network",
  isLocalDevelopment: true,
} as const;

export type BlockchainConfig = typeof blockchainConfig;
