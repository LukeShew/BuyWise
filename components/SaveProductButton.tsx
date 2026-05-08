"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { BookmarkPlus } from "lucide-react";
import { saveLocalItem } from "@/lib/savedItemsStorage";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import type { MarketplaceSource, Product } from "@/types";

const marketplaces: MarketplaceSource[] = [
  "Facebook Marketplace",
  "Craigslist",
  "eBay",
  "OfferUp",
  "Local seller",
  "Other"
];

export function SaveProductButton({ product }: { product: Product }) {
  const [session, setSession] = useState<Session | null>(null);
  const [askingPrice, setAskingPrice] = useState(product.fairPrice.toString());
  const [marketplace, setMarketplace] = useState<MarketplaceSource>("Facebook Marketplace");
  const [sellerLocation, setSellerLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const parsedPrice = Number(askingPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("Enter a valid asking price.");
      return;
    }

    setLoading(true);

    if (supabase && session) {
      const { error: insertError } = await supabase.from("saved_items").insert({
        user_id: session.user.id,
        product_id: product.id,
        asking_price: parsedPrice,
        marketplace,
        seller_location: sellerLocation,
        notes,
        status: "watching"
      });

      setLoading(false);

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setMessage("Saved to your account.");
      return;
    }

    saveLocalItem({
      productId: product.id,
      askingPrice: parsedPrice,
      marketplace,
      sellerLocation,
      notes,
      status: "watching"
    });

    setLoading(false);
    setMessage(isSupabaseConfigured() ? "Saved locally. Log in to tie it to your account." : "Saved locally for this browser.");
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <BookmarkPlus className="mt-1 h-5 w-5 text-mint" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-mint">Save listing</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Track this item</h2>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Asking price</span>
          <input
            value={askingPrice}
            onChange={(event) => setAskingPrice(event.target.value)}
            inputMode="decimal"
            className="focus-ring mt-2 h-11 w-full rounded-lg border border-stone-200 px-3"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Marketplace</span>
          <select
            value={marketplace}
            onChange={(event) => setMarketplace(event.target.value as MarketplaceSource)}
            className="focus-ring mt-2 h-11 w-full rounded-lg border border-stone-200 px-3"
          >
            {marketplaces.map((source) => (
              <option key={source}>{source}</option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-stone-700">Seller location</span>
          <input
            value={sellerLocation}
            onChange={(event) => setSellerLocation(event.target.value)}
            className="focus-ring mt-2 h-11 w-full rounded-lg border border-stone-200 px-3"
            placeholder="City, neighborhood, or marketplace location"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-stone-700">Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="focus-ring mt-2 min-h-24 w-full rounded-lg border border-stone-200 px-3 py-2"
            placeholder="Seller response, defects, meetup notes"
          />
        </label>
        {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">{error}</p> : null}
        {message ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 sm:col-span-2">{message}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="focus-ring h-11 rounded-lg bg-ink px-4 font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
        >
          {loading ? "Saving..." : "Save item"}
        </button>
      </form>
    </section>
  );
}
