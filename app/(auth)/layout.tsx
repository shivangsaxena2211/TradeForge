import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col">
      <div
        className="pointer-events-none absolute inset-0 definn-grid-bg opacity-30"
        aria-hidden="true"
      />
      <header className="relative border-b border-border/60 bg-background/80 px-4 py-6 text-center backdrop-blur-md">
        <Link href="/" className="inline-block">
          <p className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            DEFINN
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Blockchain-backed stock trading simulation
          </p>
        </Link>
      </header>
      <div className="relative flex flex-1 items-center justify-center p-4 md:p-8">
        {children}
      </div>
    </div>
  );
}
