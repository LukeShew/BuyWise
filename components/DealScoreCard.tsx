"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookmarkCheck,
  BookmarkPlus,
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  Copy,
  ExternalLink,
  ShieldCheck,
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
  Product,
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
    `${context.mode === "retail" ? "Retail bargain" : "Resale listing"} verdict: ${result.recommendation}.`,
    `Source: ${context.sourceLabel}.`,
    context.listingUrl ? `Link: ${context.listingUrl}` : "",
    `Deal score: ${result.dealScore}/100. Confidence: ${result.confidenceScore}/100.`,
    result.redFlags[0] ? `Main concern: ${result.redFlags[0].label}.` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function isSameSavedVerdict({
  savedProductId,
  targetProductId,
  askingPrice,
  notes,
  context
}: {
  savedProductId: string;
  targetProductId: string;
  askingPrice: number;
  notes: string;
  context: ListingAnalysisContext;
}) {
  if (savedProductId !== targetProductId || askingPrice !== context.askingPrice) {
    return false;
  }

  if (context.listingUrl) {
    return notes.includes(context.listingUrl);
  }

  return notes.includes(`Source: ${context.sourceLabel}.`) && askingPrice === context.askingPrice;
}

function getFallbackQuestions(result: DealQualityResult) {
  if (result.riskLevel === "High") {
    return [
      "Can you send a fresh working video with today's date in the shot?",
      "Do you have the receipt or serial number?",
      "Can I inspect it in person before any payment?"
    ];
  }

  return [
    "Can you send a short video showing it working?",
    "Are there any issues not shown in the listing?",
    "Can we meet somewhere public where I can test it?"
  ];
}

function buildNotWorthItReasons(result: DealQualityResult, context?: ListingAnalysisContext) {
  const reasons: Array<{ title: string; detail: string }> = [];

  result.redFlags.slice(0, 3).forEach((flag) => {
    reasons.push({
      title: flag.label,
      detail: flag.detail
    });
  });

  if (result.priceDifference > 0) {
    reasons.push({
      title: "The price is above the benchmark",
      detail: `This link is ${formatCurrency(result.priceDifference)} over the ${context?.benchmarkLabel.toLowerCase() ?? "used fair-value benchmark"}.`
    });
  }

  if (result.riskLevel !== "Low") {
    reasons.push({
      title: `${result.riskLevel} risk level`,
      detail: "The current details do not clear enough buyer-protection checks to treat this as an easy yes."
    });
  }

  if (result.confidenceScore < 70) {
    reasons.push({
      title: "Not enough proof yet",
      detail: "Confidence is held back until the listing shows proof like receipt, serial number, warranty, clear condition, or a working video."
    });
  }

  if (result.positiveSignals.length === 0) {
    reasons.push({
      title: "No trust signals mentioned",
      detail: "The pasted details do not mention proof that would make the seller, product condition, or checkout path feel safer."
    });
  }

  if (context?.mode === "resale" && context.retailAlternatives.length > 0) {
    reasons.push({
      title: "Buying new may be close enough",
      detail: "There is at least one retail/MSRP comparison worth checking before taking used-item risk."
    });
  }

  if (context?.mode === "retail" && context.resaleAlternatives.length > 0) {
    reasons.push({
      title: "Used options may beat the retail deal",
      detail: "BuyWise has resale alternatives that may give you better savings than this retail price."
    });
  }

  if (reasons.length === 0) {
    reasons.push({
      title: "No major blocker from the current details",
      detail: "This does not look clearly bad from the pasted information, but you should still verify condition, source, and return/payment safety before paying."
    });
  }

  return reasons.slice(0, 5);
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
              <div className="mt-3 rounded-lg bg-white p-3 ring-1 ring-stone-200">
                <p className="text-xs font-bold text-stone-500">Recommended action</p>
                <p className="mt-1 text-sm font-bold text-ink">{alternative.actionLabel}</p>
                <p className="mt-1 text-sm leading-6 text-stone-600">{alternative.outcome}</p>
              </div>
              <Link
                href={`/products/${alternative.productId}`}
                className="focus-ring mt-2 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-ink hover:text-mint"
              >
                View price guide
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </Link>
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
  product,
  context
}: {
  result: DealQualityResult;
  product?: Product;
  context?: ListingAnalysisContext;
}) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const priceGap = Math.abs(result.priceDifference);
  const benchmarkLabel = context?.benchmarkLabel ?? "Used fair-value benchmark";
  const priceGapLabel =
    result.priceDifference === 0
      ? `At ${benchmarkLabel.toLowerCase()}`
      : `${formatCurrency(priceGap)} ${result.priceDifference > 0 ? "over" : "under"} ${benchmarkLabel.toLowerCase()}`;
  const offerLabel =
    result.suggestedOfferLow === result.suggestedOfferHigh
      ? formatCurrency(result.suggestedOfferLow)
      : `${formatCurrency(result.suggestedOfferLow)} - ${formatCurrency(result.suggestedOfferHigh)}`;
  const sellerQuestions = product?.sellerQuestions.slice(0, 4) ?? getFallbackQuestions(result);
  const checklistItems = product?.buyingChecklist.slice(0, 4) ?? [
    "Verify ownership before meeting",
    "Test the item before paying",
    "Meet publicly",
    "Do not send money before inspection"
  ];
  const isRetailMode = context?.mode === "retail";
  const notWorthItReasons = buildNotWorthItReasons(result, context);

  useEffect(() => {
    if (!product || !context) {
      return;
    }

    setSaved(
      getLocalSavedItems().some((item) =>
        isSameSavedVerdict({
          savedProductId: item.productId,
          targetProductId: product.id,
          askingPrice: item.askingPrice,
          notes: item.notes,
          context
        })
      )
    );
  }, [context, product]);

  async function copyQuestions() {
    try {
      await navigator.clipboard.writeText(sellerQuestions.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function saveVerdict() {
    if (!product || !context || saving || saved) {
      return;
    }

    setSaving(true);
    const notes = buildSavedVerdictNotes(result, context);
    const marketplace: MarketplaceSource = context.mode === "retail" ? "Other" : context.marketplace;
    const savedItem = {
      productId: product.id,
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

    const alreadySaved = getLocalSavedItems().some((item) =>
      isSameSavedVerdict({
        savedProductId: item.productId,
        targetProductId: product.id,
        askingPrice: item.askingPrice,
        notes: item.notes,
        context
      })
    );

    if (!alreadySaved) {
      saveLocalItem(savedItem);
    }

    setSaved(true);
    setSaving(false);
  }

  return (
    <section className={cn("overflow-hidden rounded-lg border bg-white shadow-sm", verdictStyles[result.recommendation])}>
      <div className="border-b border-stone-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-mint">
              {isRetailMode ? "Retail bargain verdict" : "Resale listing verdict"}
            </p>
            <h2 className="mt-1 text-3xl font-black leading-tight text-ink">
              {result.recommendation}
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <RecommendationBadge label={result.recommendation} />
            {product && context ? (
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
            <span className="rounded-full bg-stone-100 px-3 py-1">{formatCurrency(context.askingPrice)} link price</span>
          </div>
        ) : null}

        <p className="mt-4 text-base leading-7 text-stone-700">{result.explanation}</p>

        <div className="mt-5 rounded-lg bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-700">
            {isRetailMode ? "Target buy range" : "Suggested offer"}
          </p>
          <p className="mt-1 text-3xl font-black text-ink">
            {offerLabel}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {isRetailMode
              ? "For retail links, treat this as a buy-under range against the MSRP benchmark and used alternatives."
              : result.negotiationTip}
          </p>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
              <p className="text-sm text-stone-500">Deal score</p>
              <p className="mt-1 text-2xl font-black text-ink">{result.dealScore}/100</p>
              <div className="mt-3 h-2 rounded-full bg-stone-100">
                <div
                  className="h-2 rounded-full bg-mint"
                  style={{ width: `${result.dealScore}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
              <p className="text-sm text-stone-500">Risk level</p>
              <p className={cn("mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold", riskStyles[result.riskLevel])}>
                {result.riskLevel}
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-600">{priceGapLabel}</p>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
              <p className="flex items-center gap-1.5 text-sm text-stone-500">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Confidence
              </p>
              <p className="mt-1 text-2xl font-black text-ink">{result.confidenceScore}/100</p>
              <div className="mt-3 h-2 rounded-full bg-stone-100">
                <div
                  className="h-2 rounded-full bg-ink"
                  style={{ width: `${result.confidenceScore}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
              <p className="flex items-center gap-1.5 text-sm text-stone-500">
                <Target className="h-4 w-4" aria-hidden />
                Benchmark gap
              </p>
              <p className="mt-1 text-2xl font-black text-ink">
                {result.priceDifference > 0 ? "+" : ""}
                {formatCurrency(result.priceDifference)}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">Compared with {benchmarkLabel.toLowerCase()}.</p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <h3 className="flex items-center gap-2 font-bold text-ink">
              <AlertTriangle className="h-4 w-4 text-danger" aria-hidden />
              Why this might NOT be worth it
            </h3>
            <div className="mt-3 space-y-2">
              {notWorthItReasons.map((reason) => (
                <div key={`${reason.title}-${reason.detail}`} className="rounded-lg bg-stone-50 p-3">
                  <p className="text-sm font-semibold text-ink">{reason.title}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{reason.detail}</p>
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
                No major text-based red flags were detected. Still verify price, source, condition, and return/payment safety.
              </p>
            )}
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <h3 className="flex items-center gap-2 font-bold text-ink">
              <ClipboardCheck className="h-4 w-4 text-mint" aria-hidden />
              Next steps before buying
            </h3>
            <ol className="mt-3 space-y-2">
              {result.nextSteps.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-lg bg-stone-50 p-3 text-sm leading-6 text-stone-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <h3 className="flex items-center gap-2 font-bold text-ink">
              <CheckCircle2 className="h-4 w-4 text-mint" aria-hidden />
              Trust signals
            </h3>
            {result.positiveSignals.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {result.positiveSignals.map((signal) => (
                  <span
                    key={signal}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-stone-600">
                The pasted details do not mention proof like receipt, serial number, warranty, public meetup, or a working video.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {context ? (
            <AlternativePanel
              title="Better retail moves"
              description="New-product fallbacks to check when warranty, returns, or a close retail price may beat the pasted link."
              emptyText="No better retail move found in the BuyWise price guides."
              alternatives={context.retailAlternatives}
              icon={ShoppingBag}
            />
          ) : null}

          {context ? (
            <AlternativePanel
              title="Better resale moves"
              description="Used-side replacement actions if this link is overpriced, risky, or not clearly better than the market."
              emptyText="No clearly better resale move found in the BuyWise price guides."
              alternatives={context.resaleAlternatives}
              icon={Target}
            />
          ) : null}

          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <div className="flex items-start justify-between gap-3">
              <h3 className="flex items-center gap-2 font-bold text-ink">
                <Clipboard className="h-4 w-4 text-mint" aria-hidden />
                Questions to ask
              </h3>
              <button
                type="button"
                onClick={copyQuestions}
                className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-semibold text-stone-700 hover:border-mint hover:text-ink"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {sellerQuestions.map((question) => (
                <p key={question} className="rounded-lg bg-stone-50 p-3 text-sm leading-6 text-stone-700">
                  {question}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <h3 className="font-bold text-ink">{isRetailMode ? "Before checkout" : "Meetup checklist"}</h3>
            <div className="mt-3 space-y-2">
              {checklistItems.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg bg-stone-50 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint" aria-hidden />
                  <p className="text-sm leading-6 text-stone-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
