"use client";

/** Colored badge for order/delivery/payment statuses. */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  // Order + delivery + payment statuses
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  processing: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  shipped: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  "in transit": "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-destructive/15 text-destructive",
  failed: "bg-destructive/15 text-destructive",
  refunded: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
};

export function StatusBadge({ value }: { value: string }) {
  const label = value ? value.replace(/_/g, " ") : "—";
  return (
    <Badge
      variant="secondary"
      className={cn(
        "capitalize",
        STYLES[value.toLowerCase()] ?? "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </Badge>
  );
}
