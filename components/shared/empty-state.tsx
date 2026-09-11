import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  action?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  icon: Icon,
  className,
  action,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "definn-card flex flex-col items-center justify-center border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      {Icon ? (
        <div
          className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary"
          aria-hidden="true"
        >
          <Icon className="size-6" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
