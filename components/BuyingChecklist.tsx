"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

export function BuyingChecklist({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const completed = Object.values(checked).filter(Boolean).length;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-mint">Buying checklist</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Review before paying</h2>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-700">
          {completed}/{items.length}
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <label
            key={item}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm leading-6 text-stone-700"
          >
            <input
              type="checkbox"
              checked={Boolean(checked[item])}
              onChange={(event) =>
                setChecked((current) => ({ ...current, [item]: event.target.checked }))
              }
              className="mt-1 h-4 w-4 rounded border-stone-300 text-mint focus:ring-mint"
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
      {completed === items.length ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Checklist complete
        </p>
      ) : null}
    </section>
  );
}
