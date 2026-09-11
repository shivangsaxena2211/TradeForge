export type BlockchainStatus = {
  connected: boolean;
  chainId: number | null;
  blockNumber: number | null;
  networkName: string;
  rpcUrl: string;
  reason?: string;
};

export type WalletBlockchainBalance = {
  address: string;
  balance: string;
  connected: boolean;
};
