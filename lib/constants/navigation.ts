import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  LayoutDashboard,
  LineChart,
  Link2,
  ListOrdered,
  Settings,
  Wallet,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const MAIN_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/markets", label: "Markets", icon: LineChart },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/orders", label: "Orders", icon: ListOrdered },
  { href: "/transactions", label: "Transactions", icon: Link2 },
  { href: "/wallet", label: "Wallet", icon: Wallet },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/markets": "Markets",
  "/portfolio": "Portfolio",
  "/orders": "Orders",
  "/transactions": "Transactions",
  "/wallet": "Wallet",
  "/settings": "Settings",
};

export const PAGE_BREADCRUMBS: Record<string, string[]> = {
  "/dashboard": ["Pages", "Dashboard"],
  "/markets": ["Pages", "Markets"],
  "/portfolio": ["Pages", "Portfolio"],
  "/orders": ["Pages", "Orders"],
  "/transactions": ["Pages", "Transactions"],
  "/wallet": ["Pages", "Wallet"],
  "/settings": ["Pages", "Settings"],
};
