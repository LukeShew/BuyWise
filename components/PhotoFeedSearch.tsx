"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock, Loader2, Search } from "lucide-react";

import { RecommendationBadge } from "@/components/RecommendationBadge";
import { formatCurrency } from "@/lib/format";
import type { PublicPhotoProduct } from "@/types";

interface FeedResponse {
  ok: boolean;
  items: PublicPhotoProduct[];
  message: string;
}

function timeRemaining(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  const hours = Math.max(0, Math.ceil(ms / (60 * 60 * 1000)));
  return hours <= 1 ? "Less than 1 hour left" : `${hours} hours left`;
}

export function PhotoFeedSearch() {
  const [items, setItems] = useState<PublicPhotoProduct[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items;
    }

    return items.filter((item) =>
      [item.title, item.sourceLabel, item.condition].filter(Boolean).join(" ").toLowerCase().includes(normalized)
    );
  }, [items, query]);

  useEffect(() => {
    async function loadFeed() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/photo-feed", {
          headers: { accept: "application/json" }
        });
        const data = (await response.json()) as FeedResponse;
        setItems(data.items ?? []);
        setMessage(data.message);
      } catch {
        setError("Could not load the photo feed.");
      } finally {
        setLoading(false);
      }
    }

    void loadFeed();
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Search recent photo analyses</span>
          <span className="relative mt-2 flex items-center">
            <Search className="pointer-events-none absolute left-4 h-5 w-5 text-stone-400" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="MacBook, camera, bike, monitor..."
              className="focus-ring h-14 w-full rounded-lg border border-stone-200 bg-stone-50 pl-12 pr-4 text-lg text-ink placeholder:text-stone-500"
            />
          </span>
        </label>
      </section>

      {loading ? (
        <div className="rounded-lg border border-stone-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-mint" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-stone-600">Loading photo feed</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <section className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-mint">24-hour product feed</p>
            <h2 className="mt-1 text-3xl font-black text-ink">
              {filteredItems.length} product{filteredItems.length === 1 ? "" : "s"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{message}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="h-48 w-full object-cover bg-stone-50" />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-stone-50 text-sm font-semibold text-stone-500">
                    No public thumbnail
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-mint">{item.sourceLabel ?? "Photo upload"}</p>
                      <h2 className="mt-1 line-clamp-2 text-xl font-black leading-tight text-ink">{item.title}</h2>
                    </div>
                    <RecommendationBadge label={item.verdict} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-stone-50 p-3">
                      <p className="text-xs font-semibold text-stone-500">Price</p>
                      <p className="mt-1 text-lg font-black text-ink">{item.price ? formatCurrency(item.price) : "No price"}</p>
                    </div>
                    <div className="rounded-lg bg-stone-50 p-3">
                      <p className="text-xs font-semibold text-stone-500">Score</p>
                      <p className="mt-1 text-lg font-black text-ink">{item.dealScore}/100</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-stone-600">
                    {item.condition ? <span className="rounded-full bg-stone-100 px-2.5 py-1">{item.condition}</span> : null}
                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {timeRemaining(item.expiresAt)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-mint">No live uploads</p>
          <h2 className="mt-1 text-2xl font-black text-ink">No approved photo products are in Search right now.</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            Valid photo analyses appear here for 24 hours. Raw uploaded screenshots stay private.
          </p>
        </section>
      )}
    </div>
  );
}
