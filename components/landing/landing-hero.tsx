import Link from "next/link";
import { ArrowRight, Network } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="relative z-10 overflow-hidden pt-32 pb-20 sm:pt-40 lg:pt-48 lg:pb-28">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold tracking-wide text-primary"
        >
          <Network className="size-4" aria-hidden="true" />
          Blockchain-Based Stock Trading Simulation
        </div>

        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="landing-gradient-text">DEFINN</span>
          <span className="mt-3 block text-foreground">
            Simulated Markets.
            <br className="hidden sm:block" />
            {" "}
            <span className="landing-gradient-text">
              Transparent On-Chain Execution.
            </span>
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
          DEFINN is an academic stock trading simulation platform combining
          realistic market simulation, smart-contract execution on a local Anvil
          network, virtual funds, and traceable transaction records. No real
          money. No real exchange execution.
        </p>

        <div
          className="mx-auto mt-6 inline-flex flex-col items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-200 sm:text-sm"
          role="note"
        >
          <span>Simulation Only</span>
          <span className="font-normal normal-case tracking-normal text-amber-200/80">
            No real money • No real exchange execution
          </span>
        </div>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="landing-glow-blue h-12 px-8 text-base font-bold shadow-none"
            render={<Link href="/register" />}
          >
            Create Account
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="landing-glass h-12 border-white/10 bg-transparent px-8 text-base font-bold hover:bg-white/5"
            render={<Link href="/login" />}
          >
            Sign In
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="h-12 px-8 text-base font-bold text-muted-foreground hover:text-foreground"
            render={<a href="#about" />}
          >
            Explore Platform
          </Button>
        </div>
      </div>
    </section>
  );
}
