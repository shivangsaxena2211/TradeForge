"use client";

import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/wallet/format";

type TxHashCopyProps = {
  txHash: string;
  className?: string;
};

export function TxHashCopy({ txHash, className }: TxHashCopyProps) {
  return (
    <span className={className}>
      <code className="font-mono text-xs">{truncateAddress(txHash)}</code>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ml-1 h-7 px-2"
        onClick={() => navigator.clipboard.writeText(txHash)}
        aria-label="Copy transaction hash"
        title="Copy transaction hash"
      >
        <Copy className="size-3.5" aria-hidden="true" />
      </Button>
    </span>
  );
}
