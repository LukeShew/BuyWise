import { BadgeDollarSign, TrendingDown } from "lucide-react";
import type { Product } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/format";

function getPriceRating(product: Product) {
  if (product.usedAvg <= product.fairPrice * 0.9) {
    return "Strong used value";
  }

  if (product.usedAvg <= product.fairPrice * 1.1) {
    return "Normal market price";
  }

  return "Sellers are asking high";
}

export function PriceSummaryCard({ product }: { product: Product }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-mint">Price summary</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">{getPriceRating(product)}</h2>
        </div>
        <BadgeDollarSign className="h-8 w-8 text-mint" aria-hidden />
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-stone-50 p-4">
          <dt className="text-sm text-stone-500">Original MSRP</dt>
          <dd className="mt-1 text-xl font-bold text-ink">{formatCurrency(product.msrp)}</dd>
        </div>
        <div className="rounded-lg bg-stone-50 p-4">
          <dt className="text-sm text-stone-500">Used average</dt>
          <dd className="mt-1 text-xl font-bold text-ink">{formatCurrency(product.usedAvg)}</dd>
        </div>
        <div className="rounded-lg bg-stone-50 p-4">
          <dt className="text-sm text-stone-500">Fair price range</dt>
          <dd className="mt-1 text-xl font-bold text-ink">
            {formatCurrency(product.usedLow)} - {formatCurrency(product.usedHigh)}
          </dd>
        </div>
        <div className="rounded-lg bg-stone-50 p-4">
          <dt className="flex items-center gap-1.5 text-sm text-stone-500">
            <TrendingDown className="h-4 w-4" aria-hidden />
            Depreciation
          </dt>
          <dd className="mt-1 text-xl font-bold text-ink">
            {formatPercent(product.depreciationPercent)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
