"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Link2, Loader2, Repeat2, ShoppingBag } from "lucide-react";
import { LISTING_DRAFT_STORAGE_KEY } from "@/lib/listingDraft";
import { inferAnalysisModeFromUrl, inferMarketplaceFromUrl } from "@/lib/linkAnalysis";
import type { LinkAnalysisMode, LinkExtractionResult, MarketplaceSource } from "@/types";

const resaleSample =
  "MacBook Air M1, 8GB RAM, 256GB. Good condition, battery health 91%. Comes with charger and original box. Can meet at library.";

const retailSample =
  "Retail product page for a new MacBook Air M1-style laptop deal. New item, warranty included, ships from retailer.";

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

export function HomeListingPrompt() {
  const router = useRouter();
  const [listingUrl, setListingUrl] = useState("");
  const [analysisMode, setAnalysisMode] = useState<LinkAnalysisMode>("resale");
  const [productName, setProductName] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [marketplace, setMarketplace] = useState<MarketplaceSource>("Facebook Marketplace");
  const [description, setDescription] = useState("");
  const [isExtractingLink, setIsExtractingLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkMessage, setLinkMessage] = useState("");
  const [lastExtractedUrl, setLastExtractedUrl] = useState("");
  const [extractionConfidence, setExtractionConfidence] = useState<number | undefined>();
  const [priceConfidence, setPriceConfidence] = useState<number | undefined>();
  const [priceSource, setPriceSource] = useState<string | undefined>();
  const [priceExplanation, setPriceExplanation] = useState<string | undefined>();
  const [productMatchConfidence, setProductMatchConfidence] = useState<number | undefined>();
  const [productMatchExplanation, setProductMatchExplanation] = useState<string | undefined>();

  function updateUrl(value: string) {
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

  const applyLinkExtraction = useCallback((data: LinkExtractionResult) => {
    setExtractionConfidence(data.confidence);
    setPriceConfidence(data.priceConfidence);
    setPriceSource(data.priceSource);
    setPriceExplanation(data.priceExplanation);
    setProductMatchConfidence(data.productMatchConfidence);
    setProductMatchExplanation(data.productMatchExplanation);

    if (data.mode) {
      setAnalysisMode(data.mode);
    }

    if (data.marketplace) {
      setMarketplace(data.marketplace);
    }

    if (data.productName ?? data.title) {
      setProductName((data.productName ?? data.title ?? "").slice(0, 140));
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
  }, []);

  const extractLinkDetails = useCallback(async (url: string, signal?: AbortSignal) => {
    setIsExtractingLink(true);
    setLinkMessage("");

    const response = await fetch("/api/extract-link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
      signal
    });
    const data = (await response.json()) as LinkExtractionResult;

    setLastExtractedUrl(url);
    applyLinkExtraction(data);
    setLinkMessage([data.message, data.priceExplanation].filter(Boolean).join(" "));

    return data;
  }, [applyLinkExtraction]);

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
      try {
        await extractLinkDetails(trimmedUrl, controller.signal);
      } catch {
        if (!controller.signal.aborted) {
          setLastExtractedUrl(trimmedUrl);
          setLinkMessage("Could not read that link. Submit it and add the missing details on the analyzer page.");
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
  }, [extractLinkDetails, lastExtractedUrl, listingUrl]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    let nextProductName = productName;
    let nextAskingPrice = askingPrice;
    let nextAnalysisMode = analysisMode;
    let nextMarketplace = marketplace;
    let nextDescription = description;
    let nextExtractionConfidence = extractionConfidence;
    let nextPriceConfidence = priceConfidence;
    let nextPriceSource = priceSource;
    let nextPriceExplanation = priceExplanation;
    let nextProductMatchConfidence = productMatchConfidence;
    let nextProductMatchExplanation = productMatchExplanation;
    const trimmedUrl = listingUrl.trim();

    if (looksLikeUrl(trimmedUrl) && trimmedUrl !== lastExtractedUrl) {
      try {
        const data = await extractLinkDetails(trimmedUrl);
        nextProductName = (data.productName ?? data.title ?? productName).slice(0, 140);
        nextAskingPrice =
          typeof data.price === "number" && Number.isFinite(data.price) ? String(data.price) : askingPrice;
        nextAnalysisMode = data.mode ?? analysisMode;
        nextMarketplace = data.marketplace ?? marketplace;
        nextDescription = buildExtractedDetails(data) || description;
        nextExtractionConfidence = data.confidence;
        nextPriceConfidence = data.priceConfidence;
        nextPriceSource = data.priceSource;
        nextPriceExplanation = data.priceExplanation;
        nextProductMatchConfidence = data.productMatchConfidence;
        nextProductMatchExplanation = data.productMatchExplanation;
      } catch {
        setLinkMessage("Could not read that link. Add the missing details on the next page.");
      } finally {
        setIsExtractingLink(false);
      }
    }

    const hasDraft = [listingUrl, nextProductName, nextAskingPrice, nextDescription].some((value) => value.trim());

    if (typeof window !== "undefined" && hasDraft) {
      window.sessionStorage.setItem(
        LISTING_DRAFT_STORAGE_KEY,
        JSON.stringify({
          listingUrl,
          analysisMode: nextAnalysisMode,
          productName: nextProductName,
          askingPrice: nextAskingPrice,
          marketplace: nextMarketplace,
          description: nextDescription,
          extractionConfidence: nextExtractionConfidence,
          priceConfidence: nextPriceConfidence,
          priceSource: nextPriceSource,
          priceExplanation: nextPriceExplanation,
          productMatchConfidence: nextProductMatchConfidence,
          productMatchExplanation: nextProductMatchExplanation
        })
      );
    } else if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(LISTING_DRAFT_STORAGE_KEY);
    }

    router.push("/submit?draft=home");
  }

  function loadResaleSample() {
    const sampleUrl = "https://www.ebay.com/itm/example-macbook-air-m1-used";
    setListingUrl(sampleUrl);
    setLastExtractedUrl(sampleUrl);
    setAnalysisMode("resale");
    setProductName("MacBook Air M1");
    setAskingPrice("420");
    setExtractionConfidence(88);
    setPriceConfidence(90);
    setPriceSource("Sample confirmed price");
    setPriceExplanation("Sample price confirmed for demo analysis.");
    setProductMatchConfidence(92);
    setProductMatchExplanation("Sample matched to MacBook Air M1.");
    setMarketplace("eBay");
    setDescription(resaleSample);
    setLinkMessage("Sample loaded. Analyze it to see the verdict.");
  }

  function loadRetailSample() {
    const sampleUrl = "https://www.bestbuy.com/site/example-macbook-air-deal";
    setListingUrl(sampleUrl);
    setLastExtractedUrl(sampleUrl);
    setAnalysisMode("retail");
    setProductName("MacBook Air M1");
    setAskingPrice("799");
    setExtractionConfidence(88);
    setPriceConfidence(90);
    setPriceSource("Sample confirmed price");
    setPriceExplanation("Sample price confirmed for demo analysis.");
    setProductMatchConfidence(92);
    setProductMatchExplanation("Sample matched to MacBook Air M1.");
    setMarketplace("Other");
    setDescription(retailSample);
    setLinkMessage("Sample loaded. Analyze it to see the verdict.");
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white">
          <Link2 className="h-5 w-5" aria-hidden />
        </div>
        <p className="mt-3 text-sm font-semibold text-mint">Link checker</p>
        <h2 className="mt-1 text-2xl font-black leading-tight text-ink">
          Drop a resale or retail link
        </h2>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          Paste the link first. BuyWise tries to pull the product, price, source, and page details automatically.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Listing or product link</span>
          <span className="relative mt-2 flex items-center">
            <Link2 className="pointer-events-none absolute left-4 h-5 w-5 text-stone-400" aria-hidden />
            <input
              value={listingUrl}
              onChange={(event) => updateUrl(event.target.value)}
              placeholder="Paste an eBay, Craigslist, Best Buy, Amazon, or other product link"
              className="focus-ring h-14 w-full rounded-lg border border-stone-200 bg-stone-50 pl-12 pr-4 text-base text-ink placeholder:text-stone-500"
            />
          </span>
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

        <div className="grid gap-2 sm:grid-cols-3">
          {["Product", "Price", "Source"].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-mint" aria-hidden />
              Auto-fills {item.toLowerCase()}
            </div>
          ))}
        </div>

        <div className="grid gap-2 rounded-lg bg-stone-100 p-1 sm:grid-cols-2">
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

        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Extra details, only if needed</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional: add seller notes, condition, warranty, coupon info, or anything the link might not show."
            className="focus-ring mt-2 min-h-24 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 leading-6 text-ink placeholder:text-stone-500"
          />
          <p className="mt-2 text-xs leading-5 text-stone-500">
            If a site blocks reading, the analyzer will ask for the missing price or model on the next page.
          </p>
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={isSubmitting || isExtractingLink}
            className="focus-ring inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-ink px-5 font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-500"
          >
            {isSubmitting || isExtractingLink ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Reading link
              </>
            ) : (
              <>
                Analyze link
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={loadResaleSample}
            className="focus-ring h-12 rounded-lg border border-stone-200 px-4 font-semibold text-stone-700 transition hover:border-mint hover:bg-stone-50 hover:text-ink"
          >
            Resale sample
          </button>
          <button
            type="button"
            onClick={loadRetailSample}
            className="focus-ring h-12 rounded-lg border border-stone-200 px-4 font-semibold text-stone-700 transition hover:border-mint hover:bg-stone-50 hover:text-ink"
          >
            Retail sample
          </button>
        </div>
      </form>
    </section>
  );
}
