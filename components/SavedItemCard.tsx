"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Product, SavedItem, SavedItemStatus } from "@/types";

const statuses: SavedItemStatus[] = ["watching", "contacted", "negotiating", "bought", "passed"];

function getSavedTitle(item: SavedItem, product?: Product) {
  if (product) {
    return `${product.brand} ${product.model}`;
  }

  const match = item.notes.match(/Product:\s*([^.]*)\./);
  return match?.[1]?.trim() || "Saved link verdict";
}

export function SavedItemCard({
  item,
  product,
  onStatusChange,
  onDelete
}: {
  item: SavedItem;
  product?: Product;
  onStatusChange: (id: string, status: SavedItemStatus) => void;
  onDelete: (id: string) => void;
}) {
  const title = getSavedTitle(item, product);

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-mint">{item.marketplace}</p>
          <h3 className="mt-1 text-xl font-bold text-ink">
            {title}
          </h3>
          <p className="mt-1 text-sm text-stone-500">{item.sellerLocation || "No location added"}</p>
        </div>
        <p className="text-2xl font-bold text-ink">{formatCurrency(item.askingPrice)}</p>
      </div>

      {product ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-stone-50 p-3">
            <p className="text-sm text-stone-500">Fair value</p>
            <p className="mt-1 font-bold text-ink">{formatCurrency(product.fairPrice)}</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-3">
            <p className="text-sm text-stone-500">Difference</p>
            <p className="mt-1 font-bold text-ink">
              {item.askingPrice - product.fairPrice > 0 ? "+" : ""}
              {formatCurrency(item.askingPrice - product.fairPrice)}
            </p>
          </div>
          <div className="rounded-lg bg-stone-50 p-3">
            <p className="text-sm text-stone-500">Product year</p>
            <p className="mt-1 font-bold text-ink">{product.year}</p>
          </div>
        </div>
      ) : null}

      {item.notes ? <p className="mt-4 text-sm leading-6 text-stone-700">{item.notes}</p> : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
          Status
          <select
            value={item.status}
            onChange={(event) => onStatusChange(item.id, event.target.value as SavedItemStatus)}
            className="focus-ring h-10 rounded-lg border border-stone-200 px-3"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          {product ? (
            <Link
              href={`/products/${product.id}`}
              className="focus-ring rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-mint hover:text-ink"
            >
              View insight
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-danger hover:text-danger"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
