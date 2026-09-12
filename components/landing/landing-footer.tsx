import Link from "next/link";
import { Code2 } from "lucide-react";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-white/5 bg-black/80 py-10 backdrop-blur-lg sm:py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="text-center sm:text-left">
          <Link
            href="/"
            className="text-2xl font-black tracking-widest landing-gradient-text"
          >
            DEFINN
          </Link>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            © {year} DEFINN. Academic simulation platform.
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Simulation only — not a real exchange or brokerage.
          </p>
        </div>

        <div className="flex items-center gap-6 text-muted-foreground">
          <a
            href="#about"
            className="text-sm transition-colors hover:text-foreground"
          >
            About
          </a>
          <a
            href="#terms"
            className="text-sm transition-colors hover:text-foreground"
          >
            Terms
          </a>
          <Link
            href="/login"
            className="text-sm transition-colors hover:text-foreground"
          >
            Sign In
          </Link>
          <span
            className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground"
            title="Repository link not configured"
            aria-hidden="true"
          >
            <Code2 className="size-4" />
          </span>
        </div>
      </div>
    </footer>
  );
}
