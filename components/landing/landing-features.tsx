import {
  Blocks,
  LineChart,
  ScrollText,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: "blue" | "emerald" | "purple" | "cyan";
};

const FEATURES: Feature[] = [
  {
    icon: Blocks,
    title: "Blockchain-Backed Trading",
    description:
      "Simulated stock trades are validated and recorded through Solidity smart contracts on a local Anvil chain.",
    accent: "blue",
  },
  {
    icon: LineChart,
    title: "Realistic Market Simulation",
    description:
      "A seeded market simulation models price movement, volatility, momentum, and market regimes using PostgreSQL data.",
    accent: "emerald",
  },
  {
    icon: Wallet,
    title: "Custom Project Wallet",
    description:
      "A project-level wallet provides the blockchain identity used for simulated trading — not a real-money wallet.",
    accent: "purple",
  },
  {
    icon: ScrollText,
    title: "Transparent Transactions",
    description:
      "Trading activity can be traced through on-chain transaction records synchronized with application order history.",
    accent: "cyan",
  },
];

const ACCENT_STYLES: Record<
  Feature["accent"],
  { icon: string; border: string }
> = {
  blue: {
    icon: "bg-primary/10 text-primary border-primary/20 group-hover:bg-primary/20",
    border: "border-primary/10",
  },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/20",
    border: "border-emerald-500/10",
  },
  purple: {
    icon: "bg-purple-500/10 text-purple-400 border-purple-500/20 group-hover:bg-purple-500/20",
    border: "border-purple-500/10",
  },
  cyan: {
    icon: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 group-hover:bg-cyan-500/20",
    border: "border-cyan-500/10",
  },
};

export function LandingFeatures() {
  return (
    <section className="relative z-10 py-20 sm:py-24" aria-labelledby="features-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 id="features-heading" className="text-2xl font-bold sm:text-3xl">
            Platform Capabilities
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Built for academic learning with production-style fintech UX.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            const styles = ACCENT_STYLES[feature.accent];

            return (
              <article
                key={feature.title}
                className={`landing-glass group rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-8 ${styles.border}`}
              >
                <div
                  className={`mb-5 flex size-14 items-center justify-center rounded-xl border text-2xl transition-colors ${styles.icon}`}
                  aria-hidden="true"
                >
                  <Icon className="size-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
