import { AlertCircle } from "lucide-react";
import type { ProductIssue } from "@/types";
import { cn } from "@/lib/utils";

const severityStyles: Record<ProductIssue["severity"], string> = {
  low: "bg-stone-100 text-stone-700",
  medium: "bg-amber-100 text-amber-900",
  high: "bg-red-100 text-red-800"
};

export function CommonIssuesList({ issues }: { issues: ProductIssue[] }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-1 h-5 w-5 text-amber" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-mint">Common problems</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Inspect these before buying</h2>
        </div>
      </div>
      <ul className="mt-5 space-y-3">
        {issues.map((issue) => (
          <li
            key={issue.issue}
            className="flex items-start justify-between gap-4 rounded-lg border border-stone-100 bg-stone-50 p-3"
          >
            <span className="text-sm leading-6 text-stone-700">{issue.issue}</span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                severityStyles[issue.severity]
              )}
            >
              {issue.severity}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
