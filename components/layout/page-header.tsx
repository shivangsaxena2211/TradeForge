import type { ReactNode } from "react";

import { cn } from "cn";

type PageHeaderProps = {
  title: string;
  description?: string;
  badge?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {title}
            </h1>
            {badge ? (
              <span
                className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
              >
                {badge}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
