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
    <header className={cn("flex flex-wrap items-start justify-between gap-2", className)}>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight md:text-xl">{title}</h1>
          {badge ? (
            <span
              className="rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
            >
              {badge}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
