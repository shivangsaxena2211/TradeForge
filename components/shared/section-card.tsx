import { cn } from "cn";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SectionCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  compact?: boolean;
};

export function SectionCard({
  title,
  description,
  children,
  className,
  action,
  compact = false,
}: SectionCardProps) {
  return (
    <Card
      className={cn(
        "definn-card border-border/60 shadow-none",
        compact && "gap-0 py-0",
        className,
      )}
    >
      <CardHeader
        className={cn(
          action ? "grid-cols-[1fr_auto]" : undefined,
          compact && "px-3 py-3",
        )}
      >
        <div>
          <CardTitle className="tf-panel-header">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-[11px]">{description}</CardDescription>
          ) : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className={cn(compact && "px-3 pb-3 pt-0")}>
        {children}
      </CardContent>
    </Card>
  );
}
