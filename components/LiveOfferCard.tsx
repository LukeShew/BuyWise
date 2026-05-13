"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { BookmarkCheck, BookmarkPlus, ExternalLink, ShieldCheck } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { getLocalSavedItems, saveLocalItem } from "@/lib/savedItemsStorage";
import { supabase } from "@/lib/supabaseClient";
import type { LiveOffer, MarketplaceSource } from "@/types";

function marketplaceFromOffer(offer: LiveOffer): MarketplaceSource {
  if (offer.sourceLabel === "eBay") {
    return "eBay";
  }

  if (offer.sourceLabel === "Craigslist") {
    return "Craigslist";
  }

  return "Other";
}

function sourceMethodLabel(method: LiveOffer["sourceMethod"]) {
  const labels: Record<LiveOffer["sourceMethod"], string> = {
    official_api: "Official API",
    affiliate_api: "Affiliate API",
    metadata: "Page metadata",
    html: "HTML parsing",
    headless: "Rendered page",
    manual: "Manual"
  };

  return labels[method];
}

export function LiveOfferCard({ offer }: { offer: LiveOffer }) {
  const [session, setSession] = useState<Session | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const canSave = typeof offer.price === "number" && Number.isFinite(offer.price);

  useEffect(() => {
    setSaved(getLocalSavedItems().some((item) => item.productId === offer.id));

    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, [offer.id]);

  async function saveOffer() {
    if (!canSave || saved || saving) {
      return;
    }

    setSaving(true);
    const savedItem = {
      productId: offer.id,
      askingPrice: offer.price ?? 0,
      marketplace: marketplaceFromOffer(offer),
      sellerLocation: offer.sourceLabel,
      notes: [
        `Live offer: ${offer.title}`,
        `Source: ${offer.sourceLabel}`,
        `Method: ${sourceMethodLabel(offer.sourceMethod)}`,
        `Confidence: ${offer.confidence}/100`,
        offer.url
      ].join("\n"),
      status: "watching" as const
    };

    if (supabase && session) {
      const { error } = await supabase.from("saved_items").insert({
        user_id: session.user.id,
        product_id: savedItem.productId,
        asking_price: savedItem.askingPrice,
        marketplace: savedItem.marketplace,
        seller_location: savedItem.sellerLocation,
        notes: savedItem.notes,
        status: savedItem.status
      });

      if (!error) {
        setSaved(true);
        setSaving(false);
        return;
      }
    }

    if (!getLocalSavedItems().some((item) => item.productId === offer.id)) {
      saveLocalItem(savedItem);
    }

    setSaved(true);
    setSaving(false);
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      {offer.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={offer.imageUrl} alt="" className="h-44 w-full object-contain bg-stone-50 p-4" />
      ) : (
        <div className="flex h-44 items-center justify-center bg-stone-50 px-6 text-center text-sm font-semibold text-stone-500">
          No product image returned
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-mint">{offer.sourceLabel}</p>
            <h2 className="mt-1 line-clamp-2 text-xl font-black leading-tight text-ink">{offer.title}</h2>
          </div>
          <button
            type="button"
            onClick={saveOffer}
            disabled={!canSave || saved || saving}
            aria-label={saved ? "Offer saved" : "Save offer"}
            className="focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:border-mint hover:text-ink disabled:cursor-default disabled:opacity-60"
          >
            {saved ? <BookmarkCheck className="h-4 w-4 text-mint" aria-hidden /> : <BookmarkPlus className="h-4 w-4" aria-hidden />}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-stone-50 p-3">
            <p className="text-xs font-semibold text-stone-500">Live price</p>
            <p className="mt-1 text-lg font-black text-ink">{offer.price ? formatCurrency(offer.price) : "Needs check"}</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-3">
            <p className="text-xs font-semibold text-stone-500">Confidence</p>
            <p className="mt-1 text-lg font-black text-ink">{offer.confidence}/100</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-stone-600">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">{sourceMethodLabel(offer.sourceMethod)}</span>
          <span className="rounded-full bg-stone-100 px-2.5 py-1">{offer.sourceType === "retail" ? "Retail" : "Resale"}</span>
          {offer.condition ? <span className="rounded-full bg-stone-100 px-2.5 py-1">{offer.condition}</span> : null}
        </div>

        <p className="mt-4 text-sm leading-6 text-stone-600">{offer.explanation}</p>

        {offer.warnings.length > 0 ? (
          <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            {offer.warnings[0]}
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500">
            <ShieldCheck className="h-4 w-4 text-mint" aria-hidden />
            {offer.priceConfidence ? `${offer.priceConfidence}/100 price confidence` : "No price confidence"}
          </span>
          <a
            href={offer.url}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-bold text-white hover:bg-stone-800"
          >
            View offer
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>
    </article>
  );
}
