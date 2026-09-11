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
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all motion-reduce:transition-none",
                  isActive
                    ? "definn-nav-active text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
