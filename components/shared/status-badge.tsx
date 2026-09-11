import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PENDING: "secondary",
  EXECUTED: "default",
  CONFIRMED: "default",
  FAILED: "destructive",
  CANCELLED: "outline",
  BUY: "default",
  SELL: "destructive",
  "Not connected": "outline",
  Unavailable: "outline",
  Locked: "secondary",
  Unlocked: "default",
  Configured: "default",
  "Device missing": "outline",
  Connected: "default",
  Disconnected: "outline",
  Offline: "outline",
  Registered: "default",
  "Not registered": "secondary",
  Checking: "outline",
  ACTIVE: "default",
  INACTIVE: "outline",
  "Market Order": "secondary",
  STOCK_BUY: "default",
  STOCK_SELL: "destructive",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = STATUS_VARIANTS[status] ?? "outline";

  return (
    <Badge variant={variant} className={cn("font-medium", className)}>
      {status}
    </Badge>
  );
}
