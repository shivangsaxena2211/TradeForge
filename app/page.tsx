import Link from "next/link";
import { Blocks, LineChart, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-10 px-4 py-16 text-center">
      <div
        className="pointer-events-none absolute inset-0 definn-grid-bg opacity-30"
        aria-hidden="true"
      />
      <div className="relative flex max-w-2xl flex-col gap-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Academic Prototype
        </p>
        <h1 className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
          DEFINN
        </h1>
        <p className="text-lg text-muted-foreground">
          Blockchain-backed stock trading simulation
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A hybrid platform combining PostgreSQL, a custom DEFINN Wallet, and
          smart-contract execution on local Anvil. Simulated market data and
          virtual cash only — no real money, NSE/BSE, or brokerage integration.
        </p>
        <div className="mx-auto grid max-w-lg gap-3 text-left sm:grid-cols-3">
          {[
            { icon: Wallet, label: "Custom Wallet" },
            { icon: Blocks, label: "Smart Contracts" },
            { icon: LineChart, label: "Simulated Market" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="definn-card flex flex-col items-center gap-2 p-4 text-center"
            >
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <span className="text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative flex flex-wrap items-center justify-center gap-3">
        <Button render={<Link href="/login" />}>Sign In</Button>
        <Button variant="outline" render={<Link href="/register" />}>
          Create Account
        </Button>
      </div>
    </main>
  );
}
