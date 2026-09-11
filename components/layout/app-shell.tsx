import type { SessionUser } from "@/lib/auth/types";

import { AppHeader } from "./app-header";
import { DesktopSidebar } from "./app-sidebar";

type AppShellProps = {
  children: React.ReactNode;
  user: SessionUser;
};

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="flex min-h-svh w-full">
      <DesktopSidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div
          className="pointer-events-none absolute inset-0 definn-grid-bg opacity-40"
          aria-hidden="true"
        />
        <AppHeader user={user} />
        <main className="relative flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
