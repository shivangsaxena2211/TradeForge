"use client";

import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/wallet/format";

type AddressCopyProps = {
  address: string;
  className?: string;
  label?: string;
};

export function AddressCopy({
  address,
  className,
  label = "Copy wallet address",
}: AddressCopyProps) {
  return (
    <span className={className}>
      <code className="font-mono text-xs">{truncateAddress(address)}</code>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ml-1 h-7 px-2"
        onClick={() => navigator.clipboard.writeText(address)}
        aria-label={label}
        title={label}
      >
        <Copy className="size-3.5" aria-hidden="true" />
      </Button>
    </span>
  );
}
