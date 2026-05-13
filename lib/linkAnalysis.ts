import type {
  LinkAnalysisMode,
  ListingAnalysisContext,
  MarketplaceSource
} from "@/types";

const sourceLabels: Array<{ label: string; terms: string[] }> = [
  { label: "eBay", terms: ["ebay."] },
  { label: "Craigslist", terms: ["craigslist."] },
  { label: "Facebook Marketplace", terms: ["facebook.", "fb."] },
  { label: "OfferUp", terms: ["offerup."] },
  { label: "Mercari", terms: ["mercari."] },
  { label: "Swappa", terms: ["swappa."] },
  { label: "Amazon", terms: ["amazon."] },
  { label: "Best Buy", terms: ["bestbuy."] },
  { label: "Walmart", terms: ["walmart."] },
  { label: "Target", terms: ["target."] },
  { label: "B&H Photo", terms: ["bhphotovideo.", "bandh."] },
  { label: "StockX", terms: ["stockx."] },
  { label: "GOAT", terms: ["goat."] },
  { label: "Adorama", terms: ["adorama."] },
  { label: "Apple", terms: ["apple."] },
  { label: "Dell", terms: ["dell."] },
  { label: "Lenovo", terms: ["lenovo."] },
  { label: "Canon", terms: ["canon."] },
  { label: "Sony", terms: ["sony."] },
  { label: "Trek", terms: ["trekbikes."] },
  { label: "Specialized", terms: ["specialized."] }
];

const resaleTerms = [
  "ebay.",
  "craigslist.",
  "facebook.",
  "fb.",
  "offerup.",
  "mercari.",
  "swappa.",
  "depop.",
  "poshmark.",
  "stockx.",
  "goat."
];

const retailTerms = [
  "amazon.",
  "bestbuy.",
  "walmart.",
  "target.",
  "costco.",
  "bhphotovideo.",
  "bandh.",
  "adorama.",
  "apple.",
  "dell.",
  "lenovo.",
  "canon.",
  "sony.",
  "trekbikes.",
  "specialized."
];

function getHostname(value?: string) {
  if (!value?.trim()) {
    return "";
  }

  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function humanizeDomain(hostname: string) {
  if (!hostname) {
    return "Unknown source";
  }

  return hostname
    .split(".")
    .filter(Boolean)
    .slice(0, 2)
    .join(".");
}

export function getSourceDomain(url?: string) {
  return getHostname(url);
}

export function getSourceLabel(url?: string, fallback = "Unknown source") {
  const hostname = getHostname(url);
  if (!hostname) {
    return fallback;
  }

  return sourceLabels.find((source) => source.terms.some((term) => hostname.includes(term)))?.label ?? humanizeDomain(hostname);
}

export function inferMarketplaceFromUrl(url?: string): MarketplaceSource | null {
  const label = getSourceLabel(url, "");

  if (label === "eBay" || label === "Craigslist" || label === "Facebook Marketplace" || label === "OfferUp") {
    return label;
  }

  return null;
}

export function inferAnalysisModeFromUrl(url?: string): LinkAnalysisMode | null {
  const hostname = getHostname(url);

  if (!hostname) {
    return null;
  }

  if (resaleTerms.some((term) => hostname.includes(term))) {
    return "resale";
  }

  if (retailTerms.some((term) => hostname.includes(term))) {
    return "retail";
  }

  return null;
}

export function buildListingAnalysisContext({
  productName,
  askingPrice,
  mode,
  listingUrl,
  marketplace,
  sellerLocation,
  priceConfidence,
  priceSource,
  priceExplanation,
  extractionConfidence,
  matchCandidates,
  resaleAlternatives = [],
  retailAlternatives = []
}: {
  productName: string;
  askingPrice: number;
  mode: LinkAnalysisMode;
  listingUrl?: string;
  marketplace: MarketplaceSource;
  sellerLocation?: string;
  priceConfidence?: number;
  priceSource?: string;
  priceExplanation?: string;
  extractionConfidence?: number;
  matchCandidates?: ListingAnalysisContext["matchCandidates"];
  resaleAlternatives?: ListingAnalysisContext["resaleAlternatives"];
  retailAlternatives?: ListingAnalysisContext["retailAlternatives"];
}): ListingAnalysisContext {
  const sourceLabel = getSourceLabel(listingUrl, mode === "retail" ? "Retail link" : marketplace);
  const sourceDomain = getSourceDomain(listingUrl);
  const dataSources = [
    listingUrl ? `${sourceLabel} page metadata and visible text` : "",
    priceSource ? priceSource : "",
    "User-confirmed price and listing details",
    "Text-based risk and trust-signal checks"
  ].filter(Boolean);

  return {
    mode,
    listingUrl: listingUrl?.trim() || undefined,
    sourceLabel,
    sourceDomain: sourceDomain || undefined,
    marketplace,
    sellerLocation: sellerLocation?.trim() || undefined,
    askingPrice,
    marketPriceLabel: undefined,
    matchedProductName: productName.trim() || "Unconfirmed product",
    priceConfidence,
    priceSource,
    priceExplanation,
    extractionConfidence,
    matchCandidates,
    dataSources,
    resaleAlternatives,
    retailAlternatives
  };
}
