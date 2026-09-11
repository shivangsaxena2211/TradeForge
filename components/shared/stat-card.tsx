import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  highlight?: boolean;
  trend?: string;
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  className,
  highlight = false,
  trend,
}: StatCardProps) {
  return (
    <article
      className={cn(
        "definn-card p-5 transition-colors hover:border-primary/25 motion-reduce:transition-none",
        highlight && "definn-card-glow",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight md:text-3xl">{value}</p>
          {trend ? (
            <p className="text-xs font-medium text-primary">{trend}</p>
          ) : null}
          {description ? (
            <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {Icon ? (
          <div className="definn-kpi-icon" aria-hidden="true">
            <Icon className="size-5" />
          </div>
        ) : null}
      </div>
    </article>
  );
}
