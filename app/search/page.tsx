import { Suspense } from "react";
import { SearchResultsClient } from "@/components/SearchResultsClient";

export default function SearchPage() {
  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold text-mint">Search used products</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Find the fair used price</h1>
        <p className="mt-3 text-stone-600">
          Search by product name, category, brand, model, or year.
        </p>
      </div>
      <Suspense fallback={<div className="rounded-lg bg-white p-6 shadow-sm">Loading search...</div>}>
        <SearchResultsClient />
      </Suspense>
    </main>
  );
}
