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
};

export function SectionCard({
  title,
  description,
  children,
  className,
  action,
}: SectionCardProps) {
  return (
    <Card className={cn("definn-card border-border/80 shadow-none", className)}>
      <CardHeader className={action ? "grid-cols-[1fr_auto]" : undefined}>
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
