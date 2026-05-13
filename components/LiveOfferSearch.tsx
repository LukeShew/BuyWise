"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Search } from "lucide-react";

import { LiveOfferCard } from "@/components/LiveOfferCard";
import type { LiveOfferSearchResponse } from "@/types";

const sourceOptions = ["All", "eBay", "Amazon", "Best Buy", "Walmart"];
const conditionOptions = ["All", "New", "Used", "Open box", "Refurbished"];

export function LiveOfferSearch() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("All");
  const [condition, setCondition] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [response, setResponse] = useState<LiveOfferSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredOffers = useMemo(() => {
    const max = Number(maxPrice);
    return (response?.offers ?? []).filter((offer) => {
      if (source !== "All" && offer.sourceLabel !== source) {
        return false;
      }

      if (condition !== "All") {
        const offerCondition = offer.condition?.toLowerCase() ?? "";
        if (!offerCondition.includes(condition.toLowerCase())) {
          return false;
        }
      }

      if (Number.isFinite(max) && max > 0 && offer.price && offer.price > max) {
        return false;
      }

      return true;
    });
  }, [condition, maxPrice, response?.offers, source]);

  async function runSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      setError("Search for a product first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await fetch(`/api/search-offers?q=${encodeURIComponent(trimmed)}&limit=8`, {
        headers: { accept: "application/json" }
      });
      const data = (await result.json()) as LiveOfferSearchResponse;
      setResponse(data);
    } catch {
      setError("Live offer search failed. Try again or paste a specific product link into the analyzer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <form onSubmit={runSearch} className="grid gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Product search</span>
            <span className="relative mt-2 flex items-center">
              <Search className="pointer-events-none absolute left-4 h-5 w-5 text-stone-400" aria-hidden />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="MacBook Air M2, Sony A6400, Trek FX 3..."
                className="focus-ring h-14 w-full rounded-lg border border-stone-200 bg-stone-50 pl-12 pr-4 text-lg text-ink placeholder:text-stone-500"
              />
            </span>
          </label>

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_0.8fr_auto] md:items-end">
            <label className="block">
              <span className="text-sm font-semibold text-stone-700">Source</span>
              <select
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="focus-ring mt-2 h-12 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 text-ink"
              >
                {sourceOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-stone-700">Condition</span>
              <select
                value={condition}
                onChange={(event) => setCondition(event.target.value)}
                className="focus-ring mt-2 h-12 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 text-ink"
              >
                {conditionOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-stone-700">Max price</span>
              <input
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                inputMode="decimal"
                placeholder="1200"
                className="focus-ring mt-2 h-12 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 text-ink placeholder:text-stone-500"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-ink px-5 font-bold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
              Search live offers
            </button>
          </div>
        </form>

        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {error}
          </div>
        ) : null}
      </section>

      {response ? (
        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-mint">Live search</p>
              <h2 className="mt-1 text-3xl font-black text-ink">
                {filteredOffers.length} result{filteredOffers.length === 1 ? "" : "s"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{response.message}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {response.providerStatuses.map((provider) => (
              <div
                key={provider.provider}
                className={`rounded-lg border p-3 text-sm leading-6 ${
                  provider.status === "configured"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : provider.status === "error"
                      ? "border-red-200 bg-red-50 text-red-900"
                      : "border-stone-200 bg-stone-50 text-stone-600"
                }`}
              >
                <p className="flex items-center gap-2 font-bold text-ink">
                  <CheckCircle2 className="h-4 w-4 text-mint" aria-hidden />
                  {provider.label}
                </p>
                <p className="mt-1">{provider.message}</p>
              </div>
            ))}
          </div>

          {filteredOffers.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredOffers.map((offer) => (
                <LiveOfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center">
              <p className="text-sm font-semibold text-mint">No live cards to show</p>
              <h2 className="mt-1 text-2xl font-black text-ink">No reliable offers matched those filters.</h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                If provider keys are missing, BuyWise will not show fake products. Add live API credentials or paste a specific product link into the analyzer.
              </p>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-mint">Real offers only</p>
          <h2 className="mt-1 text-2xl font-black text-ink">Search live product sources.</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            BuyWise will show product cards only when a configured provider returns real data. No preset catalog results are used here.
          </p>
        </section>
      )}
    </div>
  );
}
