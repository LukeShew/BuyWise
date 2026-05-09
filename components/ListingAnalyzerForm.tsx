"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  Link2,
  Loader2,
  MapPin,
  Repeat2,
  ShieldAlert,
  ShoppingBag
} from "lucide-react";
import { DealScoreCard } from "@/components/DealScoreCard";
import { mockProducts } from "@/data/mockProducts";
import { calculateDealQuality } from "@/lib/dealQuality";
import { formatCurrency } from "@/lib/format";
import { LISTING_DRAFT_STORAGE_KEY, type ListingDraft } from "@/lib/listingDraft";
import {
  buildListingAnalysisContext,
  inferAnalysisModeFromUrl,
  inferMarketplaceFromUrl
} from "@/lib/linkAnalysis";
import { findBestProductMatch } from "@/lib/productMatch";
import { supabase } from "@/lib/supabaseClient";
import type {
  DealQualityResult,
  LinkAnalysisMode,
  LinkExtractionResult,
  ListingAnalysisContext,
  MarketplaceSource,
  Product
} from "@/types";

const marketplaces: MarketplaceSource[] = [
  "Facebook Marketplace",
  "Craigslist",
  "OfferUp",
  "eBay",
  "Local seller",
  "Other"
];

interface AnalyzerValues {
  listingUrl: string;
  analysisMode: LinkAnalysisMode;
  productName: string;
  askingPrice: string;
  condition: string;
  description: string;
  sellerNotes: string;
  marketplace: MarketplaceSource;
  location: string;
  requireProductMatch?: boolean;
}

function findClosestProduct(productName: string) {
  return findBestProductMatch(productName);
}

function looksLikeUrl(value: string) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) || /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|\?|#|$)/i.test(trimmed);
}

function buildExtractedDetails(data: LinkExtractionResult) {
  return [
    data.title ? `Title: ${data.title}` : "",
    data.description ? `Description: ${data.description}` : "",
    data.sourceLabel ? `Source: ${data.sourceLabel}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function AnalyzerEmptyState() {
  return (
    <section className="rounded-lg border border-dashed border-stone-300 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
          <ClipboardCheck className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-mint">No verdict yet</p>
          <h2 className="mt-1 text-2xl font-black text-ink">Drop a link or paste the listing details</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            BuyWise will try to pull the page title, price, and summary. If the site blocks reading, paste the missing details manually.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {[
          "For resale links: paste seller wording, condition, proof, and pickup notes",
          "For retail links: paste product name, sale price, retailer, warranty, and deal notes",
          "BuyWise compares the link against used fair value and retail MSRP benchmarks"
        ].map((item) => (
          <div key={item} className="flex items-start gap-3 rounded-lg bg-stone-50 p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint" aria-hidden />
            <p className="text-sm leading-6 text-stone-700">{item}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-lg bg-amber-50 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-amber-950">
          <ShieldAlert className="h-4 w-4" aria-hidden />
          Buyer rule
        </h3>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          A low resale price still needs proof. A retail sale still needs comparison against used prices and MSRP.
        </p>
      </div>
    </section>
  );
}

export function ListingAnalyzerForm({
  initialProduct,
  autoAnalyzeDraft = false,
  focusResultOnAnalyze = false
}: {
  initialProduct?: Product;
  autoAnalyzeDraft?: boolean;
  focusResultOnAnalyze?: boolean;
}) {
  const [listingUrl, setListingUrl] = useState("");
  const [analysisMode, setAnalysisMode] = useState<LinkAnalysisMode>("resale");
  const [productId, setProductId] = useState(initialProduct?.id ?? mockProducts[0].id);
  const selectedProduct = useMemo(
    () => mockProducts.find((product) => product.id === productId) ?? mockProducts[0],
    [productId]
  );
  const [productName, setProductName] = useState(
    initialProduct ? `${initialProduct.brand} ${initialProduct.model}` : ""
  );
  const [askingPrice, setAskingPrice] = useState(initialProduct?.fairPrice.toString() ?? "");
  const [condition, setCondition] = useState("Good");
  const [description, setDescription] = useState("");
  const [sellerNotes, setSellerNotes] = useState("");
  const [marketplace, setMarketplace] = useState<MarketplaceSource>("Facebook Marketplace");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<DealQualityResult | null>(null);
  const [analysisContext, setAnalysisContext] = useState<ListingAnalysisContext | null>(null);
  const [analyzedProduct, setAnalyzedProduct] = useState<Product | undefined>(initialProduct);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtractingLink, setIsExtractingLink] = useState(false);
  const [linkMessage, setLinkMessage] = useState("");
  const [lastExtractedUrl, setLastExtractedUrl] = useState("");
  const [isLoadingDraft, setIsLoadingDraft] = useState(autoAnalyzeDraft && !initialProduct);
  const shouldFocusResult = autoAnalyzeDraft || focusResultOnAnalyze;

  function updateListingUrl(value: string) {
    setListingUrl(value);

    const inferredMode = inferAnalysisModeFromUrl(value);
    const inferredMarketplace = inferMarketplaceFromUrl(value);

    if (inferredMode) {
      setAnalysisMode(inferredMode);
    }

    if (inferredMarketplace) {
      setMarketplace(inferredMarketplace);
    }
  }

  function applyLinkExtraction(data: LinkExtractionResult) {
    if (data.mode) {
      setAnalysisMode(data.mode);
    }

    if (data.marketplace) {
      setMarketplace(data.marketplace);
    }

    const extractedProductName = data.productName ?? data.title;
    if (extractedProductName) {
      const trimmedName = extractedProductName.slice(0, 140);
      setProductName(trimmedName);

      const match = findClosestProduct(trimmedName);
      if (match) {
        setProductId(match.id);
        setAnalyzedProduct(match);
      }
    }

    if (typeof data.price === "number" && Number.isFinite(data.price)) {
      setAskingPrice(String(data.price));
    }

    const extractedDetails = buildExtractedDetails(data);
    if (extractedDetails) {
      setDescription((current) => {
        if (!current.trim() || current.trim().startsWith("Title: ")) {
          return extractedDetails;
        }
        return current;
      });
    }
  }

  function getCurrentValues(): AnalyzerValues {
    return {
      listingUrl,
      analysisMode,
      productName,
      askingPrice,
      condition,
      description,
      sellerNotes,
      marketplace,
      location
    };
  }

  const runAnalysis = useCallback(async (values: AnalyzerValues) => {
    setError("");
    setMessage("");

    const parsedPrice = Number(values.askingPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("BuyWise needs the listing price before it can give a verdict.");
      return false;
    }

    setIsAnalyzing(true);

    try {
      const matchedProduct = findClosestProduct(values.productName) ?? selectedProduct;
      if (values.requireProductMatch && !findClosestProduct(values.productName)) {
        setError("BuyWise read the link, but this product is not in the current price guides yet. Choose the closest guide to finish the verdict.");
        return false;
      }

      setProductId(matchedProduct.id);
      setAnalyzedProduct(matchedProduct);

      const listingText = [values.description, values.sellerNotes, values.marketplace, values.location].filter(Boolean).join(" ");
      const conditionText = [values.condition, values.description, values.sellerNotes].join(" ");
      const benchmarkFairPrice = values.analysisMode === "retail" ? matchedProduct.msrp : matchedProduct.fairPrice;
      const benchmarkLow = values.analysisMode === "retail" ? Math.round(matchedProduct.msrp * 0.75) : matchedProduct.usedLow;
      const benchmarkHigh = values.analysisMode === "retail" ? Math.round(matchedProduct.msrp * 1.05) : matchedProduct.usedHigh;
      const scamRiskScore =
        values.analysisMode === "retail" ? Math.max(1, matchedProduct.scamRiskScore - 4) : matchedProduct.scamRiskScore;

      const nextResult = calculateDealQuality({
        askingPrice: parsedPrice,
        fairPrice: benchmarkFairPrice,
        usedLow: benchmarkLow,
        usedHigh: benchmarkHigh,
        reliabilityScore: matchedProduct.reliabilityScore,
        scamRiskScore,
        condition: conditionText,
        marketplace: values.analysisMode === "retail" ? undefined : values.marketplace,
        listingText
      });

      const nextContext = buildListingAnalysisContext({
        product: matchedProduct,
        askingPrice: parsedPrice,
        mode: values.analysisMode,
        listingUrl: values.listingUrl,
        marketplace: values.marketplace,
        sellerLocation: values.location
      });

      setResult(nextResult);
      setAnalysisContext(nextContext);

      if (!listingText.trim()) {
        setMessage("Verdict ready. Paste page details or seller wording for a stronger confidence score.");
      }

      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const { error: insertError } = await supabase.from("listing_checks").insert({
            user_id: data.session.user.id,
            product_id: matchedProduct.id,
            asking_price: parsedPrice,
            condition: values.condition,
            description: [
              values.listingUrl ? `Link: ${values.listingUrl}` : "",
              `Link type: ${values.analysisMode}`,
              values.description,
              values.sellerNotes,
              values.location ? `Location: ${values.location}` : ""
            ]
              .filter(Boolean)
              .join("\n\n"),
            marketplace: values.marketplace,
            deal_score: nextResult.dealScore,
            risk_level: nextResult.riskLevel,
            confidence_score: nextResult.confidenceScore,
            price_difference: nextResult.priceDifference,
            red_flags: nextResult.redFlags,
            positive_signals: nextResult.positiveSignals,
            suggested_offer_low: nextResult.suggestedOfferLow,
            suggested_offer_high: nextResult.suggestedOfferHigh
          });

          if (insertError) {
            setError(insertError.message);
            return false;
          }

          setMessage("Listing check saved to your account.");
        }
      }

      return true;
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (initialProduct || typeof window === "undefined") {
      return;
    }

    const rawDraft = window.sessionStorage.getItem(LISTING_DRAFT_STORAGE_KEY);
    if (!rawDraft) {
      setIsLoadingDraft(false);
      return;
    }

    try {
      const draft = JSON.parse(rawDraft) as ListingDraft;
      const draftListingUrl = draft.listingUrl ?? "";
      const draftAnalysisMode =
        draft.analysisMode ?? inferAnalysisModeFromUrl(draftListingUrl) ?? "resale";
      const draftMarketplace =
        draft.marketplace ?? inferMarketplaceFromUrl(draftListingUrl) ?? "Facebook Marketplace";

      if (draftListingUrl) {
        setListingUrl(draftListingUrl);
      }

      setAnalysisMode(draftAnalysisMode);

      if (draft.productName) {
        setProductName(draft.productName);
        const match = findClosestProduct(draft.productName);
        if (match) {
          setProductId(match.id);
          setAnalyzedProduct(match);
        }
      }
      if (draft.askingPrice) {
        setAskingPrice(draft.askingPrice);
      }
      setMarketplace(draftMarketplace);
      if (draft.description) {
        setDescription(draft.description);
      }
      if (autoAnalyzeDraft) {
        void runAnalysis({
          listingUrl: draftListingUrl,
          analysisMode: draftAnalysisMode,
          productName: draft.productName ?? "",
          askingPrice: draft.askingPrice ?? "",
          condition: "Good",
          description: draft.description ?? "",
          sellerNotes: "",
          marketplace: draftMarketplace,
          location: "",
          requireProductMatch: true
        }).finally(() => setIsLoadingDraft(false));
      } else {
        setMessage("Draft loaded. Add anything missing, then analyze.");
        setIsLoadingDraft(false);
      }
    } catch {
      setError("Could not load the link draft. Paste it again.");
      setIsLoadingDraft(false);
    } finally {
      window.sessionStorage.removeItem(LISTING_DRAFT_STORAGE_KEY);
    }
  }, [autoAnalyzeDraft, initialProduct, runAnalysis]);

  useEffect(() => {
    const trimmedUrl = listingUrl.trim();

    if (!trimmedUrl) {
      setLinkMessage("");
      setLastExtractedUrl("");
      return;
    }

    if (!looksLikeUrl(trimmedUrl) || trimmedUrl === lastExtractedUrl) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsExtractingLink(true);
      setLinkMessage("");

      try {
        const response = await fetch("/api/extract-link", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: trimmedUrl }),
          signal: controller.signal
        });
        const data = (await response.json()) as LinkExtractionResult;

        setLastExtractedUrl(trimmedUrl);
        applyLinkExtraction(data);
        setLinkMessage(data.message);
      } catch {
        if (!controller.signal.aborted) {
          setLastExtractedUrl(trimmedUrl);
          setLinkMessage("Could not read that link. Paste the price and description manually.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsExtractingLink(false);
        }
      }
    }, 700);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
      setIsExtractingLink(false);
    };
  }, [lastExtractedUrl, listingUrl]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAnalysis(getCurrentValues());
  }

  if (isLoadingDraft) {
    return (
      <section className="rounded-lg border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-ink text-white">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        </div>
        <p className="mt-4 text-sm font-semibold text-mint">Building verdict</p>
        <h2 className="mt-1 text-2xl font-black text-ink">Checking this link now</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-stone-600">
          BuyWise is using the link details from the homepage so you can get straight to the buyer verdict.
        </p>
      </section>
    );
  }

  if (shouldFocusResult && result) {
    return (
      <DealScoreCard result={result} product={analyzedProduct} context={analysisContext ?? undefined} />
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)] xl:items-start">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink text-white">
            <Calculator className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-mint">Link and deal details</p>
            <h2 className="mt-1 text-2xl font-black leading-tight text-ink">
              Rate this place to buy
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Drop a resale or retail link, add the price/model, and BuyWise compares it against used and retail benchmarks.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {["Drop link", "Rate bargain", "Compare alternatives"].map((item) => (
            <div key={item} className="rounded-lg bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700">
              {item}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-stone-700">Listing or product link</span>
            <span className="relative mt-2 flex items-center">
              <Link2 className="pointer-events-none absolute left-3 h-4 w-4 text-stone-400" aria-hidden />
              <input
                value={listingUrl}
                onChange={(event) => updateListingUrl(event.target.value)}
                placeholder="Paste an eBay, Craigslist, Best Buy, Amazon, or other product link"
                className="focus-ring h-12 w-full rounded-lg border border-stone-200 bg-stone-50 pl-10 pr-3 text-ink placeholder:text-stone-500"
              />
            </span>
            <p className="mt-2 text-xs leading-5 text-stone-500">
              BuyWise tries to pull the title, price, and page summary automatically. Some marketplaces block this, so manual details still help.
            </p>
            {isExtractingLink || linkMessage ? (
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-600">
                {isExtractingLink ? (
                  <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-mint" aria-hidden />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint" aria-hidden />
                )}
                <p>{isExtractingLink ? "Reading the link..." : linkMessage}</p>
              </div>
            ) : null}
          </label>

          <div className="md:col-span-2">
            <span className="text-sm font-semibold text-stone-700">What kind of link is this?</span>
            <div className="mt-2 grid gap-2 rounded-lg bg-stone-100 p-1 sm:grid-cols-2">
              {[
                { value: "resale" as const, label: "Resale listing", icon: Repeat2 },
                { value: "retail" as const, label: "Retail bargain", icon: ShoppingBag }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAnalysisMode(option.value)}
                  className={`focus-ring flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition ${
                    analysisMode === option.value ? "bg-white text-ink shadow-sm" : "text-stone-600 hover:text-ink"
                  }`}
                >
                  <option.icon className="h-4 w-4" aria-hidden />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-stone-700">Product or model</span>
            <input
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              placeholder="Example: MacBook Air M1, Sony A6400, Trek FX 3"
              className="focus-ring mt-2 h-12 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 text-ink placeholder:text-stone-500"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-stone-700">Closest price guide</span>
            <select
              value={productId}
              onChange={(event) => {
                const nextProduct = mockProducts.find((product) => product.id === event.target.value);
                setProductId(event.target.value);
                if (nextProduct) {
                  setProductName(`${nextProduct.brand} ${nextProduct.model}`);
                }
              }}
              className="focus-ring mt-2 h-12 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 text-ink"
            >
              {mockProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.brand} {product.model} ({product.year}) - used fair {formatCurrency(product.fairPrice)} / MSRP {formatCurrency(product.msrp)}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-stone-500">
              BuyWise currently has price guides for cameras, laptops, bikes, and monitors.
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Link price</span>
            <span className="relative mt-2 flex items-center">
              <DollarSign className="pointer-events-none absolute left-3 h-4 w-4 text-stone-400" aria-hidden />
              <input
                value={askingPrice}
                onChange={(event) => setAskingPrice(event.target.value)}
                inputMode="decimal"
                placeholder="800"
                className="focus-ring h-12 w-full rounded-lg border border-stone-200 bg-stone-50 pl-9 pr-3 text-ink placeholder:text-stone-500"
              />
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Condition or deal state</span>
            <select
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
              className="focus-ring mt-2 h-12 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 text-ink"
            >
              <option>Like new</option>
              <option>Excellent</option>
              <option>Good</option>
              <option>Fair</option>
              <option>Poor</option>
              <option>For parts or repair</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Marketplace/source</span>
            <select
              value={marketplace}
              onChange={(event) => setMarketplace(event.target.value as MarketplaceSource)}
              className="focus-ring mt-2 h-12 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 text-ink"
            >
              {marketplaces.map((source) => (
                <option key={source}>{source}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Location</span>
            <span className="relative mt-2 flex items-center">
              <MapPin className="pointer-events-none absolute left-3 h-4 w-4 text-stone-400" aria-hidden />
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="City or seller location"
                className="focus-ring h-12 w-full rounded-lg border border-stone-200 bg-stone-50 pl-10 pr-3 text-ink placeholder:text-stone-500"
              />
            </span>
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-stone-700">
              {analysisMode === "retail" ? "Retail page details" : "Listing text"}
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={
                analysisMode === "retail"
                  ? "Paste product title, sale notes, warranty details, shipping notes, or discount claims."
                  : "Paste the title and full description. Include condition, accessories, defects, pickup details, and seller wording."
              }
              className="focus-ring mt-2 min-h-36 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 leading-6 text-ink placeholder:text-stone-500"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-stone-700">
              {analysisMode === "retail" ? "Extra deal notes" : "Seller replies or extra notes"}
            </span>
            <textarea
              value={sellerNotes}
              onChange={(event) => setSellerNotes(event.target.value)}
              placeholder={
                analysisMode === "retail"
                  ? "Example: open box, warranty included, ships from retailer, final sale, refurbished, coupon price"
                  : "Example: no receipt, must go today, can send video, public meetup, battery health 91%"
              }
              className="focus-ring mt-2 min-h-24 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 leading-6 text-ink placeholder:text-stone-500"
            />
          </label>

          {error ? (
            <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-900 md:col-span-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p className="leading-6">{error}</p>
            </div>
          ) : null}
          {message ? (
            <div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 md:col-span-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p className="leading-6">{message}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isAnalyzing}
            className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-ink px-4 font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-500 md:col-span-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Checking link
              </>
            ) : (
              "Analyze link"
            )}
          </button>
        </form>
      </section>

      {result ? (
        <DealScoreCard result={result} product={analyzedProduct} context={analysisContext ?? undefined} />
      ) : (
        <AnalyzerEmptyState />
      )}
    </div>
  );
}
