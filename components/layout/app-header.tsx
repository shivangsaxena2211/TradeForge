"use client";

import { usePathname } from "next/navigation";

import { StatusBadge } from "@/components/shared/status-badge";
import { useOnChainRegistration } from "@/components/wallet/use-on-chain-registration";
import { useWalletContext } from "@/components/wallet/wallet-provider";
import type { SessionUser } from "@/lib/auth/types";
import { PAGE_BREADCRUMBS, PAGE_TITLES } from "@/lib/constants/navigation";

import { MobileNav } from "./app-sidebar";
import { TopbarSearch } from "./topbar-search";
import { UserMenu } from "./user-menu";

type AppHeaderProps = {
  user: SessionUser;
};

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] ?? "DEFINN";
  const breadcrumb = PAGE_BREADCRUMBS[pathname] ?? ["DEFINN", pageTitle];
  const { blockchainConnected } = useWalletContext();
  const onChainRegistered = useOnChainRegistration();

  return (
    <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-3 border-b border-border/50 bg-background/90 px-3 backdrop-blur-md supports-backdrop-filter:bg-background/80 md:px-4">
      <MobileNav />
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-[10px] text-muted-foreground">
            {breadcrumb.join(" / ")}
          </p>
          <h2 className="truncate text-sm font-semibold tracking-tight">
            {pageTitle}
          </h2>
        </div>
        <TopbarSearch />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div
          className="hidden items-center gap-1.5 rounded-lg border border-border/50 bg-card/60 px-2 py-1 sm:flex"
          aria-label="Blockchain connection status"
        >
          <span
            className={`size-1.5 rounded-full ${blockchainConnected ? "bg-success" : "bg-muted-foreground"}`}
            aria-hidden="true"
          />
          <div className="text-[10px] leading-tight">
            <p className="font-medium text-foreground">
              {blockchainConnected ? "Connected" : "Offline"}
            </p>
            <p className="text-muted-foreground">Chain 31337</p>
          </div>
          {onChainRegistered === true ? (
            <StatusBadge status="Registered" className="hidden text-[9px] lg:inline-flex" />
          ) : null}
        </div>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
