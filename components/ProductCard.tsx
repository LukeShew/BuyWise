"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Bookmark, BookmarkCheck, Gauge, ShieldAlert, TrendingDown } from "lucide-react";
import type { Product } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/format";
import { RecommendationBadge } from "@/components/RecommendationBadge";
import { getLocalSavedItems, saveLocalItem } from "@/lib/savedItemsStorage";
import { supabase } from "@/lib/supabaseClient";

export function ProductCard({ product }: { product: Product }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkSavedState() {
      const localSaved = getLocalSavedItems().some((item) => item.productId === product.id);
      if (localSaved) {
        setSaved(true);
        return;
      }

      if (!supabase) {
        setSaved(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        if (isMounted) {
          setSaved(false);
        }
        return;
      }

      const { data } = await supabase
        .from("saved_items")
        .select("id")
        .eq("product_id", product.id)
        .limit(1);

      if (isMounted) {
        setSaved(Boolean(data?.length));
      }
    }

    void checkSavedState();

    return () => {
      isMounted = false;
    };
  }, [product.id]);

  async function saveProduct() {
    if (saving || saved) {
      return;
    }

    setSaving(true);
    const savedItem = {
      productId: product.id,
      askingPrice: product.fairPrice,
      marketplace: "Other" as const,
      sellerLocation: "",
      notes: `Saved from the ${product.brand} ${product.model} price guide.`,
      status: "watching" as const
    };

    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { error } = await supabase.from("saved_items").insert({
          user_id: data.session.user.id,
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
    }

    const alreadySaved = getLocalSavedItems().some((item) => item.productId === product.id);
    if (!alreadySaved) {
      saveLocalItem(savedItem);
    }

    setSaved(true);
    setSaving(false);
  }

  return (
    <article className="relative rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <button
        type="button"
        onClick={saveProduct}
        disabled={saving || saved}
        aria-label={saved ? "Saved" : `Save ${product.brand} ${product.model}`}
        title={saved ? "Saved" : "Save"}
        className="focus-ring absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:border-mint hover:text-ink disabled:cursor-default disabled:border-mint disabled:bg-emerald-50 disabled:text-mint"
      >
        {saved ? <BookmarkCheck className="h-4 w-4" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}
      </button>

      <div className="pr-10">
        <p className="text-sm font-medium text-mint">{product.category}</p>
        <h3 className="mt-1 text-xl font-bold text-ink">
          {product.brand} {product.model}
        </h3>
        <p className="mt-1 text-sm text-stone-500">{product.year}</p>
        <div className="mt-3">
          <RecommendationBadge label={product.recommendation} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg bg-stone-50 p-3">
          <p className="text-stone-500">Used avg</p>
          <p className="mt-1 font-bold text-ink">{formatCurrency(product.usedAvg)}</p>
        </div>
        <div className="rounded-lg bg-stone-50 p-3">
          <p className="text-stone-500">Fair price</p>
          <p className="mt-1 font-bold text-ink">{formatCurrency(product.fairPrice)}</p>
        </div>
        <div className="rounded-lg bg-stone-50 p-3">
          <p className="text-stone-500">MSRP drop</p>
          <p className="mt-1 font-bold text-ink">{formatPercent(product.depreciationPercent)}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-600">
        <span className="inline-flex items-center gap-1.5">
          <Gauge className="h-4 w-4" aria-hidden />
          Reliability {product.reliabilityScore}/10
        </span>
        <span className="inline-flex items-center gap-1.5">
          <TrendingDown className="h-4 w-4" aria-hidden />
          Demand {product.demandScore}/10
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4" aria-hidden />
          Scam probability {product.scamRiskScore}/10
        </span>
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-6 text-stone-600">
        {product.recommendationExplanation}
      </p>

      <Link
        href={`/products/${product.id}`}
        className="focus-ring mt-5 inline-flex items-center gap-2 rounded-lg font-semibold text-ink hover:text-mint"
      >
        View insight
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </article>
  );
}
