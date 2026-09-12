import { Blocks, LineChart, Shield, Wallet } from "lucide-react";

const FEATURES = [
  { icon: LineChart, label: "Virtual stock trading" },
  { icon: Blocks, label: "Blockchain-backed execution" },
  { icon: Shield, label: "Realistic market simulation" },
  { icon: Wallet, label: "Transparent transaction history" },
] as const;

export function AuthBrandPanel() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden p-6 md:p-8 lg:p-10">
      <div
        className="pointer-events-none absolute inset-0 definn-grid-bg opacity-20"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary"
            aria-hidden="true"
          >
            <span className="text-sm font-bold">DF</span>
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">DEFINN</p>
            <p className="text-[11px] text-muted-foreground">
              Blockchain-Based Stock Trading Simulation
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">
            Build your portfolio on a transparent simulated market.
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            DEFINN combines realistic market simulation, smart-contract
            execution, virtual funds, and on-chain transaction records — for
            academic learning only.
          </p>
        </div>

        <ul className="space-y-2.5">
          {FEATURES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5 text-sm">
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"
                aria-hidden="true"
              >
                ✓
              </span>
              <Icon className="size-3.5 text-primary" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mt-8 hidden lg:block" aria-hidden="true">
        <div className="definn-card overflow-hidden p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Market Preview
            </p>
            <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
              SIMULATION
            </span>
          </div>
          <div className="space-y-2">
            {[
              { sym: "RELIANCE", chg: "+1.24%" },
              { sym: "TCS", chg: "-0.42%" },
              { sym: "INFY", chg: "+0.87%" },
            ].map((row) => (
              <div
                key={row.sym}
                className="flex items-center justify-between rounded-md bg-surface-inset px-2.5 py-1.5 text-xs"
              >
                <span className="font-medium">{row.sym}</span>
                <span
                  className={
                    row.chg.startsWith("+") ? "text-success" : "text-destructive"
                  }
                >
                  {row.chg}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex h-16 items-end gap-0.5">
            {[40, 55, 45, 70, 60, 80, 65, 90, 75, 85].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-primary/30"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Decorative preview — not live market data.
        </p>
      </div>
    </div>
  );
}
