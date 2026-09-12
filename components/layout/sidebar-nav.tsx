"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "cn";

import type { NavItem } from "@/lib/constants/navigation";

type SidebarNavProps = {
  items: NavItem[];
  onNavigate?: () => void;
  label?: string;
};

export function SidebarNav({
  items,
  onNavigate,
  label = "Main navigation",
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={label}>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all motion-reduce:transition-none",
                  isActive
                    ? "definn-nav-active text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
