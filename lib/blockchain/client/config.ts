/**
 * Browser-safe blockchain configuration for client-side signing.
 * RPC URL is not secret for local Anvil development.
 */
export const clientBlockchainDefaults = {
  rpcUrl: "http://127.0.0.1:8545",
  chainId: 31337,
  networkName: "DEFINN Local Network",
} as const;

export function getClientBlockchainConfig() {
  return {
    rpcUrl:
      process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL ??
      clientBlockchainDefaults.rpcUrl,
    chainId: Number(
      process.env.NEXT_PUBLIC_CHAIN_ID ??
        String(clientBlockchainDefaults.chainId),
    ),
    networkName: clientBlockchainDefaults.networkName,
  };
}

export type ClientBlockchainConfig = ReturnType<
  typeof getClientBlockchainConfig
>;
