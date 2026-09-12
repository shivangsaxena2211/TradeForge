"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  MAIN_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
} from "@/lib/constants/navigation";

import { SidebarNav } from "./sidebar-nav";
import { SidebarWalletCard } from "./sidebar-wallet-card";

function SidebarBrand() {
  return (
    <div className="px-0.5">
      <Link href="/dashboard" className="group block">
        <div className="flex items-center gap-2">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"
            aria-hidden="true"
          >
            <span className="text-xs font-bold">DF</span>
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-bold tracking-tight text-foreground">
              DEFINN
            </span>
            <p className="truncate text-[10px] leading-tight text-muted-foreground">
              Simulated trading platform
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col gap-3 p-2.5">
        <SidebarNav items={MAIN_NAV_ITEMS} onNavigate={onNavigate} />
        <Separator className="bg-sidebar-border" />
        <SidebarNav
          items={SECONDARY_NAV_ITEMS}
          onNavigate={onNavigate}
          label="Settings navigation"
        />
      </div>
      <div className="border-t border-sidebar-border p-2.5">
        <SidebarWalletCard />
      </div>
    </div>
  );
}

export function DesktopSidebar() {
  return (
    <aside
      className="hidden w-[220px] shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col"
      aria-label="Application sidebar"
    >
      <div className="flex h-12 items-center border-b border-sidebar-border px-3">
        <SidebarBrand />
      </div>
      <SidebarContent />
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="size-8 border-border/60 lg:hidden"
            aria-label="Open navigation menu"
          />
        }
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 border-sidebar-border bg-sidebar p-0">
        <SheetHeader className="border-b border-sidebar-border p-3">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBrand />
        </SheetHeader>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
