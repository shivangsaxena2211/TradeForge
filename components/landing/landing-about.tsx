import { Network } from "lucide-react";

export function LandingAbout() {
  return (
    <section
      id="about"
      className="relative z-10 scroll-mt-24 border-t border-white/5 bg-gradient-to-b from-transparent to-black/50 py-20 sm:py-24"
      aria-labelledby="about-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-12 lg:flex-row lg:gap-16">
          <div className="lg:w-1/2">
            <h2 id="about-heading" className="text-3xl font-extrabold sm:text-4xl">
              About DEFINN
            </h2>
            <div
              className="mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-primary to-emerald-400"
              aria-hidden="true"
            />
            <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
              DEFINN is an academic and educational stock trading simulation
              platform. It combines a realistic market simulation engine,
              PostgreSQL-backed instrument data, virtual funds, and smart-contract
              trade execution to demonstrate how blockchain transparency can
              complement traditional application workflows.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              The platform uses a local{" "}
              <span className="font-semibold text-foreground">Anvil</span>{" "}
              blockchain,{" "}
              <span className="font-semibold text-foreground">Foundry</span>{" "}
              tooling, and{" "}
              <span className="font-semibold text-foreground">Solidity</span>{" "}
              contracts to record simulated buy and sell activity. DEFINN is not
              a real decentralized stock exchange and does not submit orders to
              NSE, BSE, or any brokerage.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>• Seeded NSE equity universe with simulated price paths</li>
              <li>• Custom project wallet for authenticated simulated trading</li>
              <li>• On-chain transaction hashes for confirmed trades</li>
              <li>• Portfolio, orders, and transaction views in the web app</li>
            </ul>
          </div>

          <div className="relative w-full lg:w-1/2">
            <div
              className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary to-emerald-500 opacity-20 blur"
              aria-hidden="true"
            />
            <div
              className="landing-glass relative z-10 flex aspect-video items-center justify-center overflow-hidden rounded-2xl shadow-2xl"
              aria-hidden="true"
            >
              <Network className="size-20 text-muted-foreground/40 sm:size-28" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-left backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Architecture Preview
                </p>
                <p className="text-xs text-foreground">
                  Next.js UI → PostgreSQL → Anvil / Stock.sol
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
