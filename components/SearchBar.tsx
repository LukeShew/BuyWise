"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { getSearchSuggestions } from "@/lib/search";

export function SearchBar({
  initialQuery = "",
  compact = false
}: {
  initialQuery?: string;
  compact?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const search = query.trim();
    router.push(search ? `/search?q=${encodeURIComponent(search)}` : "/search");
  }

  return (
    <div className="w-full">
      <form
        onSubmit={onSubmit}
        className="flex w-full flex-col gap-3 rounded-lg border border-stone-200 bg-white p-2 shadow-soft sm:flex-row"
      >
        <label className="relative flex flex-1 items-center">
          <Search className="pointer-events-none absolute left-4 h-5 w-5 text-stone-400" aria-hidden />
          <span className="sr-only">Search product</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a used product, brand, model, or year"
            className="focus-ring h-12 w-full rounded-lg border border-transparent bg-stone-50 pl-11 pr-4 text-base text-ink placeholder:text-stone-500"
          />
        </label>
        <button
          type="submit"
          className="focus-ring h-12 rounded-lg bg-ink px-6 font-semibold text-white transition hover:bg-stone-800"
        >
          Check price
        </button>
      </form>

      {!compact ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-stone-600">Try:</span>
          {getSearchSuggestions().map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setQuery(suggestion);
                router.push(`/search?q=${encodeURIComponent(suggestion)}`);
              }}
              className="focus-ring rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-mint hover:text-ink"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
