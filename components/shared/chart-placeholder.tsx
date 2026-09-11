import { LineChart } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

type ChartPlaceholderProps = {
  title: string;
  description?: string;
};

export function ChartPlaceholder({ title, description }: ChartPlaceholderProps) {
  return (
    <EmptyState
      title={title}
      description={
        description ??
        "Chart visualization will be added in a later phase. Demo placeholder only."
      }
      icon={LineChart}
      className="min-h-[220px]"
    />
  );
}
