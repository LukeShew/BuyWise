"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { Product } from "@/types";
import { buildDepreciationData } from "@/lib/depreciation";
import { formatCurrency } from "@/lib/format";

export function DepreciationChart({ product }: { product: Product }) {
  const data = buildDepreciationData(product);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-semibold text-mint">Depreciation</p>
        <h2 className="mt-1 text-2xl font-bold text-ink">Estimated value over time</h2>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
            <XAxis dataKey="year" tickLine={false} axisLine={false} />
            <YAxis
              width={76}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(Number(value))}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), "Estimated value"]}
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e7e5e4"
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#4f9d7e"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
