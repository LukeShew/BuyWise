"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { supportedCategories } from "@/data/mockProducts";
import { searchProducts } from "@/lib/search";
import type { ProductCategory } from "@/types";

export function SearchResultsClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [category, setCategory] = useState<ProductCategory | "All">("All");
  const [minYear, setMinYear] = useState("");

  const products = useMemo(
    () =>
      searchProducts({
        query: initialQuery,
        category,
        minYear: minYear ? Number(minYear) : undefined
      }),
    [initialQuery, category, minYear]
  );

  return (
    <div className="space-y-8">
      <SearchBar initialQuery={initialQuery} compact />

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as ProductCategory | "All")}
              className="focus-ring mt-2 h-11 w-full rounded-lg border border-stone-200 px-3"
            >
              <option>All</option>
              {supportedCategories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Minimum year</span>
            <input
              value={minYear}
              onChange={(event) => setMinYear(event.target.value)}
              inputMode="numeric"
              placeholder="2020"
              className="focus-ring mt-2 h-11 w-full rounded-lg border border-stone-200 px-3"
            />
          </label>
        </div>
      </section>

      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-ink">
            {products.length} {products.length === 1 ? "result" : "results"}
          </h2>
          <p className="text-sm text-stone-500">BuyWise price guides</p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-white p-8 text-center shadow-sm">
            <h3 className="text-xl font-bold text-ink">No matching products</h3>
            <p className="mt-2 text-stone-600">Try a broader model name, brand, category, or remove the year filter.</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
