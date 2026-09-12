import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh definn-page-bg">
      <div
        className="pointer-events-none absolute inset-0 definn-grid-bg opacity-20"
        aria-hidden="true"
      />
      <div className="relative grid w-full lg:grid-cols-2">
        <div className="hidden border-r border-border/40 bg-sidebar/50 lg:block">
          <AuthBrandPanel />
        </div>
        <div className="flex flex-col">
          <div className="border-b border-border/40 p-4 lg:hidden">
            <p className="text-center text-sm font-bold">DEFINN</p>
          </div>
          <div className="flex flex-1 items-center justify-center p-4 md:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
