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
    <div className="px-1">
      <Link href="/dashboard" className="group block">
        <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-xl font-bold tracking-tight text-transparent">
          DEFINN
        </span>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
          Blockchain-backed stock trading simulation
        </p>
      </Link>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col gap-5 p-3">
        <SidebarNav items={MAIN_NAV_ITEMS} onNavigate={onNavigate} />
        <Separator className="bg-sidebar-border" />
        <SidebarNav
          items={SECONDARY_NAV_ITEMS}
          onNavigate={onNavigate}
          label="Settings navigation"
        />
      </div>
      <div className="border-t border-sidebar-border p-3">
        <SidebarWalletCard />
      </div>
    </div>
  );
}

export function DesktopSidebar() {
  return (
    <aside
      className="hidden w-[260px] shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col"
      aria-label="Application sidebar"
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
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
            className="border-border/60 lg:hidden"
            aria-label="Open navigation menu"
          />
        }
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
        <SheetHeader className="border-b border-sidebar-border p-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBrand />
        </SheetHeader>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
