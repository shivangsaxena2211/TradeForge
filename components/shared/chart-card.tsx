import { cn } from "cn";

type ChartCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  compact?: boolean;
};

export function ChartCard({
  title,
  description,
  children,
  className,
  action,
  compact = false,
}: ChartCardProps) {
  return (
    <section
      className={cn(
        "definn-card flex flex-col overflow-hidden",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="tf-panel-header">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
