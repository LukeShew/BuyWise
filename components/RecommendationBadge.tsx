import type { RecommendationLabel } from "@/types";
import { cn } from "@/lib/utils";

const badgeStyles: Record<RecommendationLabel, string> = {
  "Great deal": "bg-emerald-100 text-emerald-800 ring-emerald-200",
  "Fair price": "bg-sky-100 text-sky-800 ring-sky-200",
  Overpriced: "bg-amber-100 text-amber-900 ring-amber-200",
  "Risky purchase": "bg-orange-100 text-orange-900 ring-orange-200",
  Avoid: "bg-red-100 text-red-800 ring-red-200"
};

export function RecommendationBadge({
  label,
  className
}: {
  label: RecommendationLabel;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1",
        badgeStyles[label],
        className
      )}
    >
      {label}
    </span>
  );
}
