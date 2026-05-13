"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookmarkCheck,
  BookmarkPlus,
  CheckCircle2,
  ShoppingBag,
  Target
} from "lucide-react";

import { RecommendationBadge } from "@/components/RecommendationBadge";
import { formatCurrency } from "@/lib/format";
import { getLocalSavedItems, saveLocalItem } from "@/lib/savedItemsStorage";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import type {
  DealQualityResult,
  ListingAlternative,
  ListingAnalysisContext,
  MarketplaceSource,
  RecommendationLabel
} from "@/types";

const verdictStyles: Record<RecommendationLabel, string> = {
  "Great deal": "border-emerald-200 bg-emerald-50/40",
  "Fair price": "border-sky-200 bg-sky-50/40",
  Overpriced: "border-amber-200 bg-amber-50/50",
  "Risky purchase": "border-orange-200 bg-orange-50/50",
  Avoid: "border-red-200 bg-red-50/50"
};

const riskStyles: Record<DealQualityResult["riskLevel"], string> = {
  Low: "text-emerald-800 bg-emerald-100",
  Medium: "text-amber-900 bg-amber-100",
  High: "text-red-900 bg-red-100"
};

function buildSavedVerdictNotes(result: DealQualityResult, context: ListingAnalysisContext) {
  return [
    `Photo verdict: ${result.recommendation}.`,
    `Source: ${context.sourceLabel}.`,
    `Product: ${context.matchedProductName}.`,
    `Deal score: ${result.dealScore}/100. Confidence: ${result.confidenceScore}/100.`,
    result.redFlags[0] ? `Main concern: ${result.redFlags[0].label}.` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function AlternativePanel({
  title,
  description,
  emptyText,
  alternatives,
  icon: Icon
}: {
  title: string;
  description: string;
  emptyText: string;
  alternatives: ListingAlternative[];
  icon: typeof ShoppingBag;
}) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
      <h3 className="flex items-center gap-2 font-bold text-ink">
        <Icon className="h-4 w-4 text-mint" aria-hidden />
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>

      {alternatives.length > 0 ? (
        <div className="mt-3 space-y-2">
          {alternatives.map((alternative) => (
            <div key={`${alternative.sourceType}-${alternative.productId}`} className="rounded-lg bg-stone-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink">{alternative.title}</p>
                  <p className="mt-1 text-xs font-semibold text-stone-500">{alternative.priceLabel}</p>
                </div>
                <p className="shrink-0 text-lg font-black text-ink">{formatCurrency(alternative.price)}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-700">{alternative.reason}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-stone-50 p-3 text-sm leading-6 text-stone-600">{emptyText}</p>
      )}
    </div>
  );
}

export function DealScoreCard({
  result,
  context
}: {
  result: DealQualityResult;
  context?: ListingAnalysisContext;
}) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const priceGap = Math.abs(result.priceDifference);
  const hasMarketPrice = Boolean(context?.marketPriceLabel);
  const marketPriceLabel = context?.marketPriceLabel ?? "verified market price";
  const priceGapLabel = !hasMarketPrice
    ? "Market price not verified yet"
    : result.priceDifference === 0
      ? `At ${marketPriceLabel.toLowerCase()}`
      : `${formatCurrency(priceGap)} ${result.priceDifference > 0 ? "over" : "under"} ${marketPriceLabel.toLowerCase()}`;
  const offerLabel =
    result.suggestedOfferLow === result.suggestedOfferHigh
      ? formatCurrency(result.suggestedOfferLow)
      : `${formatCurrency(result.suggestedOfferLow)} - ${formatCurrency(result.suggestedOfferHigh)}`;
  const subScores = [
    { label: "Price / Value", value: result.priceAttractivenessScore },
    { label: "Trust / Safety", value: result.trustSafetyScore },
    { label: "Condition", value: result.conditionScore },
    { label: "Market Fit", value: result.marketCompetitivenessScore },
    { label: "Confidence", value: result.confidenceScore }
  ];
  const confidenceStyle =
    result.confidenceLevel === "High"
      ? "bg-emerald-50 text-emerald-900 ring-emerald-100"
      : result.confidenceLevel === "Medium"
        ? "bg-amber-50 text-amber-950 ring-amber-100"
        : "bg-red-50 text-red-950 ring-red-100";

  useEffect(() => {
    if (!context) {
      return;
    }

    setSaved(getLocalSavedItems().some((item) => item.productId === "photo-analysis" && item.askingPrice === context.askingPrice));
  }, [context]);

  async function saveVerdict() {
    if (!context || saving || saved) {
      return;
    }

    setSaving(true);
    const notes = buildSavedVerdictNotes(result, context);
    const marketplace: MarketplaceSource = context.marketplace;
    const savedItem = {
      productId: "photo-analysis",
      askingPrice: context.askingPrice,
      marketplace,
      sellerLocation: context.sellerLocation ?? "",
      notes,
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

    saveLocalItem(savedItem);
    setSaved(true);
    setSaving(false);
  }

  return (
    <section className={cn("overflow-hidden rounded-lg border bg-white shadow-sm", verdictStyles[result.recommendation])}>
      <div className="border-b border-stone-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-mint">Photo deal score</p>
            <h2 className="mt-1 text-5xl font-black leading-none text-ink">
              {result.dealScore}
              <span className="text-2xl text-stone-400">/100</span>
            </h2>
            <p className="mt-2 text-xl font-black text-ink">{result.marketPositionLabel}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <RecommendationBadge label={result.recommendation} />
            <span className={cn("inline-flex rounded-full px-3 py-1 text-sm font-bold", riskStyles[result.riskLevel])}>
              {result.riskLevel} risk
            </span>
            {context ? (
              <button
                type="button"
                onClick={saveVerdict}
                disabled={saving || saved}
                aria-label={saved ? "Verdict saved" : "Save verdict"}
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-stone-700 shadow-sm transition hover:border-mint hover:text-ink disabled:cursor-default disabled:border-mint disabled:bg-emerald-50 disabled:text-mint"
              >
                {saved ? <BookmarkCheck className="h-4 w-4" aria-hidden /> : <BookmarkPlus className="h-4 w-4" aria-hidden />}
                {saving ? "Saving..." : saved ? "Saved" : "Save verdict"}
              </button>
            ) : null}
          </div>
        </div>

        {context ? (
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-stone-600">
            <span className="rounded-full bg-stone-100 px-3 py-1">{context.sourceLabel}</span>
            <span className="rounded-full bg-stone-100 px-3 py-1">{context.matchedProductName}</span>
            <span className="rounded-full bg-stone-100 px-3 py-1">{formatCurrency(context.askingPrice)} price</span>
          </div>
        ) : null}

        <p className="mt-4 text-base leading-7 text-stone-700">{result.explanation}</p>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-stone-100">
          <div className="h-full rounded-full bg-ink" style={{ width: `${result.dealScore}%` }} />
        </div>

        <div className={cn("mt-5 rounded-lg p-4 ring-1", confidenceStyle)}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold">Confidence</p>
              <p className="mt-1 text-2xl font-black">{result.confidenceLevel} confidence</p>
            </div>
            <p className="text-sm font-bold">{result.confidenceScore}/100</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {result.confidenceReasons.map((reason) => (
              <div key={reason} className="rounded-lg bg-white/70 px-3 py-2 text-sm font-semibold">
                {reason}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-lg bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-700">Suggested offer</p>
          <p className="mt-1 text-3xl font-black text-ink">{offerLabel}</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">{result.negotiationTip}</p>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {subScores.map((score) => (
              <div key={score.label} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
                <p className="text-sm text-stone-500">{score.label}</p>
                <p className="mt-1 text-2xl font-black text-ink">{score.value}/100</p>
                <div className="mt-3 h-2 rounded-full bg-stone-100">
                  <div className="h-2 rounded-full bg-mint" style={{ width: `${score.value}%` }} />
                </div>
              </div>
            ))}
            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
              <p className="flex items-center gap-1.5 text-sm text-stone-500">
                <Target className="h-4 w-4" aria-hidden />
                Market check
              </p>
              <p className="mt-1 text-2xl font-black text-ink">{priceGapLabel}</p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <h3 className="flex items-center gap-2 font-bold text-ink">
              <AlertTriangle className="h-4 w-4 text-danger" aria-hidden />
              Why this score?
            </h3>
            <div className="mt-3 space-y-2">
              {result.scoreBreakdown.map((item) => (
                <div key={`${item.label}-${item.detail}`} className="rounded-lg bg-stone-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">{item.label}</p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
                        item.tone === "positive"
                          ? "bg-emerald-100 text-emerald-900"
                          : item.tone === "negative"
                            ? "bg-red-100 text-red-900"
                            : "bg-stone-200 text-stone-700"
                      )}
                    >
                      {item.impact}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <h3 className="flex items-center gap-2 font-bold text-ink">
              <AlertTriangle className="h-4 w-4 text-danger" aria-hidden />
              Red flags
            </h3>
            {result.redFlags.length > 0 ? (
              <div className="mt-3 space-y-2">
                {result.redFlags.map((flag) => (
                  <div key={`${flag.label}-${flag.detail}`} className="rounded-lg bg-red-50 p-3">
                    <p className="text-sm font-semibold text-red-900">{flag.label}</p>
                    <p className="mt-1 text-sm leading-6 text-red-800">{flag.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-stone-600">
                No major text-based red flags were detected from the photos.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
              <h3 className="flex items-center gap-2 font-bold text-ink">
                <CheckCircle2 className="h-4 w-4 text-mint" aria-hidden />
                Pros
              </h3>
              {result.pros.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {result.pros.map((item) => (
                    <p key={item} className="rounded-lg bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">
                      {item}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-stone-600">No clear advantage found from the current details.</p>
              )}
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
              <h3 className="flex items-center gap-2 font-bold text-ink">
                <AlertTriangle className="h-4 w-4 text-danger" aria-hidden />
                Cons
              </h3>
              {result.cons.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {result.cons.map((item) => (
                    <p key={item} className="rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-900">
                      {item}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-stone-600">No major downside found from the current details.</p>
              )}
            </div>
          </div>

          {context ? (
            <AlternativePanel
              title="Better retail moves"
              description="New-product fallbacks to check when warranty, returns, or a close retail price may beat this photo listing."
              emptyText="BuyWise does not have verified retail alternatives for this product yet."
              alternatives={context.retailAlternatives}
              icon={ShoppingBag}
            />
          ) : null}

          {context ? (
            <AlternativePanel
              title="Better resale moves"
              description="Used-side replacement actions if this listing is overpriced, risky, or not clearly better than market."
              emptyText="BuyWise does not have verified resale alternatives for this product yet."
              alternatives={context.resaleAlternatives}
              icon={Target}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
