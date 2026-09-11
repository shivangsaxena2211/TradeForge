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
        description="Application preferences and environment information for the DEFINN academic prototype."
        badge="Academic Simulation"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Account">
          <div className="flex items-start gap-3">
            <div className="definn-kpi-icon size-10 rounded-lg">
              <User className="size-4" aria-hidden="true" />
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">Application authentication</p>
              <p className="text-muted-foreground">
                DEFINN uses Auth.js with email/password credentials. Profile
                editing and password reset are not yet available in this
                prototype.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Security">
          <div className="flex items-start gap-3">
            <div className="definn-kpi-icon size-10 rounded-lg">
              <Lock className="size-4" aria-hidden="true" />
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">Wallet and session security</p>
              <p className="text-muted-foreground">
                Passwords are hashed with Argon2id. Private keys and mnemonics
                remain client-side in the DEFINN Wallet encrypted keystore.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Blockchain">
          <div className="flex items-start gap-3">
            <div className="definn-kpi-icon size-10 rounded-lg">
              <Blocks className="size-4" aria-hidden="true" />
            </div>
            <dl className="space-y-2 text-sm">
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
                <dd className="font-mono text-xs">{blockchainConfig.rpcUrl}</dd>
              </div>
              <p className="pt-2 text-muted-foreground">
                Local Anvil only — not Ethereum Mainnet. Default dev keys must
                never hold real funds.
              </p>
            </dl>
          </div>
        </SectionCard>

        <SectionCard title="Application">
          <div className="flex items-start gap-3">
            <div className="definn-kpi-icon size-10 rounded-lg">
              <Settings2 className="size-4" aria-hidden="true" />
            </div>
            <div className="space-y-1 text-sm">
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
