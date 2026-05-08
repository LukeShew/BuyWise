import { mockProducts } from "@/data/mockProducts";
import { formatCurrency } from "@/lib/format";
import type {
  LinkAnalysisMode,
  ListingAlternative,
  ListingAnalysisContext,
  MarketplaceSource,
  Product
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
  "poshmark."
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

function productTitle(product: Product) {
  return `${product.brand} ${product.model}`;
}

function uniqueAlternatives(items: ListingAlternative[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.sourceType}-${item.productId}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildResaleAlternatives(product: Product, askingPrice: number) {
  const selectedProductAlternative: ListingAlternative[] =
    product.fairPrice <= askingPrice * 0.9
      ? [
          {
            productId: product.id,
            title: productTitle(product),
            price: product.fairPrice,
            priceLabel: "Fair used price",
            sourceType: "resale",
            actionLabel: "Use this as your used-price target",
            outcome: "Push the seller toward this number before you meet.",
            reason: `${formatCurrency(product.fairPrice)} is the current mock fair used price for this model.`
          }
        ]
      : [];

  const sameCategory = mockProducts
    .filter((candidate) => candidate.category === product.category && candidate.id !== product.id)
    .filter((candidate) => candidate.fairPrice <= askingPrice * 0.92)
    .filter((candidate) => candidate.recommendation !== "Avoid")
    .sort((a, b) => a.fairPrice - b.fairPrice)
    .slice(0, 3)
    .map<ListingAlternative>((candidate) => ({
      productId: candidate.id,
      title: productTitle(candidate),
      price: candidate.fairPrice,
      priceLabel: "Fair used price",
      sourceType: "resale",
      actionLabel: "Compare this used option first",
      outcome: "A cheaper resale path may give you the same outcome with less overpay risk.",
      reason: `${formatCurrency(candidate.fairPrice)} fair used value, which is meaningfully below this link price.`
    }));

  return uniqueAlternatives([...selectedProductAlternative, ...sameCategory]).slice(0, 4);
}

function buildRetailAlternatives(product: Product, askingPrice: number, mode: LinkAnalysisMode) {
  const closeNewBenchmark: ListingAlternative[] =
    mode === "resale" && product.msrp <= askingPrice * 1.15
      ? [
          {
            productId: product.id,
            title: productTitle(product),
            price: product.msrp,
            priceLabel: "Original MSRP",
            sourceType: "retail",
            actionLabel: "Check the new-price gap before buying used",
            outcome: "If new is close, warranty and returns may be worth more than the discount.",
            reason: `New MSRP is close enough to this used price that buying new may be worth comparing.`
          }
        ]
      : [];

  const sameCategory = mockProducts
    .filter((candidate) => candidate.category === product.category && candidate.id !== product.id)
    .filter((candidate) => candidate.msrp <= askingPrice * 0.95)
    .sort((a, b) => a.msrp - b.msrp)
    .slice(0, 3)
    .map<ListingAlternative>((candidate) => ({
      productId: candidate.id,
      title: productTitle(candidate),
      price: candidate.msrp,
      priceLabel: "Original MSRP",
      sourceType: "retail",
      actionLabel: "Compare buying this new",
      outcome: "This gives you a retail fallback if the pasted deal is weak.",
      reason: `${formatCurrency(candidate.msrp)} MSRP is lower than this link price in the current mock catalog.`
    }));

  return uniqueAlternatives([...closeNewBenchmark, ...sameCategory]).slice(0, 4);
}

export function buildListingAnalysisContext({
  product,
  askingPrice,
  mode,
  listingUrl,
  marketplace,
  sellerLocation
}: {
  product: Product;
  askingPrice: number;
  mode: LinkAnalysisMode;
  listingUrl?: string;
  marketplace: MarketplaceSource;
  sellerLocation?: string;
}): ListingAnalysisContext {
  const sourceLabel = getSourceLabel(listingUrl, mode === "retail" ? "Retail link" : marketplace);
  const sourceDomain = getSourceDomain(listingUrl);

  return {
    mode,
    listingUrl: listingUrl?.trim() || undefined,
    sourceLabel,
    sourceDomain: sourceDomain || undefined,
    marketplace,
    sellerLocation: sellerLocation?.trim() || undefined,
    askingPrice,
    benchmarkLabel: mode === "retail" ? "Retail MSRP benchmark" : "Used fair-value benchmark",
    matchedProductName: productTitle(product),
    resaleAlternatives: buildResaleAlternatives(product, askingPrice),
    retailAlternatives: buildRetailAlternatives(product, askingPrice, mode)
  };
}
