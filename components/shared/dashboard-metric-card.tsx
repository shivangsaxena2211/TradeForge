import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

type DashboardMetricCardProps = {
  title: string;
  value: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  trend?: string;
  trendPositive?: boolean;
};

export function DashboardMetricCard({
  title,
  value,
  description,
  icon: Icon,
  className,
  trend,
  trendPositive,
}: DashboardMetricCardProps) {
  return (
    <article
      className={cn(
        "definn-card flex items-start justify-between gap-2 p-3 transition-colors hover:border-primary/20 motion-reduce:transition-none",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="tf-metric-label">{title}</p>
        <p className="tf-metric-value">{value}</p>
        {trend ? (
          <p
            className={cn(
              "text-[11px] font-medium",
              trendPositive === true
                ? "text-success"
                : trendPositive === false
                  ? "text-destructive"
                  : "text-primary",
            )}
          >
            {trend}
          </p>
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
    </article>
  );
}
