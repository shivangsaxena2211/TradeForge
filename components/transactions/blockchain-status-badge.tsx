import { StatusBadge } from "@/components/shared/status-badge";

type BlockchainStatusBadgeProps = {
  connected: boolean;
};

export function BlockchainStatusBadge({ connected }: BlockchainStatusBadgeProps) {
  return (
    <StatusBadge status={connected ? "Connected" : "Unavailable"} />
  );
}
