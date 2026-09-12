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
        "definn-card p-3 transition-colors hover:border-primary/20 motion-reduce:transition-none",
        highlight && "border-primary/20",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="tf-metric-label">{title}</p>
          <p className="tf-metric-value">{value}</p>
          {trend ? (
            <p className="text-[11px] font-medium text-primary">{trend}</p>
          ) : null}
          {description ? (
            <p className="text-[11px] leading-snug text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <Icon className="size-3.5" />
          </div>
        ) : null}
      </div>
    </article>
  );
}
