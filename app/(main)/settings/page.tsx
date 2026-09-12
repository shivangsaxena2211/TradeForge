import type { Metadata } from "next";
import { Blocks, Lock, Settings2, User } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { blockchainConfig } from "@/lib/blockchain/config";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Application preferences and environment information for DEFINN."
        badge="Simulation Only"
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <SectionCard title="Account" compact>
          <div className="flex items-start gap-3">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
              aria-hidden="true"
            >
              <User className="size-4" />
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-medium">Application authentication</p>
              <p className="text-muted-foreground">
                DEFINN uses Auth.js with email/password credentials. Profile
                editing and password reset are not yet available.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Security" compact>
          <div className="flex items-start gap-3">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
              aria-hidden="true"
            >
              <Lock className="size-4" />
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-medium">Wallet and session security</p>
              <p className="text-muted-foreground">
                Passwords are hashed with Argon2id. Private keys and mnemonics
                remain client-side in the DEFINN Wallet encrypted keystore.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Blockchain" compact>
          <div className="flex items-start gap-3">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
              aria-hidden="true"
            >
              <Blocks className="size-4" />
            </div>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Network</dt>
                <dd className="font-medium">{blockchainConfig.networkName}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Chain ID</dt>
                <dd className="font-mono font-medium">{blockchainConfig.chainId}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">RPC</dt>
                <dd className="font-mono text-[10px]">{blockchainConfig.rpcUrl}</dd>
              </div>
              <p className="pt-1 text-muted-foreground">
                Local Anvil only — not Ethereum Mainnet.
              </p>
            </dl>
          </div>
        </SectionCard>

        <SectionCard title="Application" compact>
          <div className="flex items-start gap-3">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
              aria-hidden="true"
            >
              <Settings2 className="size-4" />
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-medium">DEFINN simulation disclaimer</p>
              <p className="text-muted-foreground">
                This is an academic blockchain stock-trading simulation. It does
                not trade real stocks, use real money, connect to NSE/BSE, or
                operate as a production exchange.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
