/**
 * Development-only Anvil admin key for contract deployment scripts and price sync.
 * Never expose via NEXT_PUBLIC_* or client bundles.
 */
export function getAnvilAdminPrivateKey(): string {
  const key =
    process.env.ANVIL_ADMIN_PRIVATE_KEY ??
    process.env.BLOCKCHAIN_ADMIN_PRIVATE_KEY;

  if (!key?.trim()) {
    throw new Error(
      "ANVIL_ADMIN_PRIVATE_KEY is not set. Add it to .env.local for local development.",
    );
  }

  return key.trim();
}
