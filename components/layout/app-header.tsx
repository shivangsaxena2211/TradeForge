"use client";

import { usePathname } from "next/navigation";
import { Blocks } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { useOnChainRegistration } from "@/components/wallet/use-on-chain-registration";
import { useWalletContext } from "@/components/wallet/wallet-provider";
import type { SessionUser } from "@/lib/auth/types";
import { PAGE_BREADCRUMBS, PAGE_TITLES } from "@/lib/constants/navigation";

import { MobileNav } from "./app-sidebar";
import { UserMenu } from "./user-menu";

type AppHeaderProps = {
  user: SessionUser;
};

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] ?? "DEFINN";
  const breadcrumb = PAGE_BREADCRUMBS[pathname] ?? ["Pages", pageTitle];
  const { blockchainConnected } = useWalletContext();
  const onChainRegistered = useOnChainRegistration();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/70 md:px-6">
      <MobileNav />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-xs text-muted-foreground">
            {breadcrumb.join(" / ")}
          </p>
          <h2 className="truncate text-lg font-semibold tracking-tight md:text-xl">
            {pageTitle}
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="hidden items-center gap-2 rounded-xl border border-border/60 bg-card/50 px-3 py-1.5 sm:flex"
            aria-label="Blockchain connection status"
          >
            <Blocks className="size-4 text-primary" aria-hidden="true" />
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Chain 31337
              </p>
              <StatusBadge
                status={blockchainConnected ? "Connected" : "Unavailable"}
              />
            </div>
            {onChainRegistered === true ? (
              <span className="hidden text-xs text-muted-foreground lg:inline">
                Registered
              </span>
            ) : null}
          </div>
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
