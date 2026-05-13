import crypto from "crypto";

import { getSourceDomain, getSourceLabel, inferAnalysisModeFromUrl } from "@/lib/linkAnalysis";
import type {
  LinkAnalysisMode,
  LiveOffer,
  OfferProviderStatus,
  OfferProviderStatusType
} from "@/types";

const DEFAULT_LIMIT = 8;
const REQUEST_TIMEOUT_MS = 8000;

interface SearchOptions {
  query: string;
  limit?: number;
}

interface LookupOptions {
  url: string;
}

interface ProviderResult {
  offers: LiveOffer[];
  status: OfferProviderStatus;
}

interface ProviderAdapter {
  id: string;
  label: string;
  isConfigured: () => boolean;
  missingMessage: string;
  search?: (options: SearchOptions) => Promise<LiveOffer[]>;
  lookupUrl?: (options: LookupOptions) => Promise<LiveOffer[]>;
}

function nowIso() {
  return new Date().toISOString();
}

function hashId(value: string) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 18);
}

function status(
  provider: ProviderAdapter,
  nextStatus: OfferProviderStatusType,
  message: string
): OfferProviderStatus {
  return {
    provider: provider.id,
    label: provider.label,
    status: nextStatus,
    message
  };
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function parsePrice(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const match = value.replace(/,/g, "").match(/([0-9]+(?:\.[0-9]{1,2})?)/);
  if (!match) {
    return undefined;
  }

  const price = Number.parseFloat(match[1]);
  return Number.isFinite(price) && price > 0 && price < 100_000 ? price : undefined;
}

function withTimeout(signal?: AbortSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const timeout = withTimeout(init?.signal ?? undefined);
  try {
    const response = await fetch(url, {
      ...init,
      signal: timeout.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    timeout.done();
  }
}

function makeOffer({
  title,
  url,
  sourceLabel,
  sourceType,
  price,
  currency = "USD",
  condition,
  imageUrl,
  merchantName,
  availability,
  confidence,
  priceConfidence,
  explanation
}: {
  title: string;
  url: string;
  sourceLabel: string;
  sourceType: LinkAnalysisMode;
  price?: number;
  currency?: string;
  condition?: string;
  imageUrl?: string;
  merchantName?: string;
  availability?: string;
  confidence: number;
  priceConfidence?: number;
  explanation: string;
}): LiveOffer {
  const sourceDomain = getSourceDomain(url);
  return {
    id: hashId(`${sourceLabel}:${url}:${title}:${price ?? ""}`),
    title,
    url,
    canonicalUrl: url,
    sourceLabel,
    sourceDomain: sourceDomain || undefined,
    sourceType,
    sourceMethod: "official_api",
    price,
    currency,
    condition,
    imageUrl,
    merchantName,
    availability,
    confidence,
    priceConfidence,
    explanation,
    warnings: price ? [] : ["Price was not returned by the provider."],
    fetchedAt: nowIso()
  };
}

function extractEbayLegacyId(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const fromPath = url.pathname.match(/\/itm\/(?:[^/]+\/)?(\d{9,})/i)?.[1];
    return fromPath ?? url.searchParams.get("item") ?? url.searchParams.get("itm");
  } catch {
    return null;
  }
}

async function getEbayAccessToken() {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing eBay credentials");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const timeout = withTimeout();
  try {
    const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        authorization: `Basic ${auth}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "https://api.ebay.com/oauth/api_scope"
      }),
      signal: timeout.signal
    });

    if (!response.ok) {
      throw new Error(`eBay token HTTP ${response.status}`);
    }

    const data = (await response.json()) as { access_token?: string };
    if (!data.access_token) {
      throw new Error("eBay did not return an access token");
    }

    return data.access_token;
  } finally {
    timeout.done();
  }
}

interface EbaySearchResponse {
  itemSummaries?: Array<{
    itemId?: string;
    title?: string;
    itemWebUrl?: string;
    image?: { imageUrl?: string };
    price?: { value?: string; currency?: string };
    currentBidPrice?: { value?: string; currency?: string };
    condition?: string;
    seller?: { username?: string };
    itemLocation?: { country?: string };
    buyingOptions?: string[];
  }>;
}

function mapEbayItems(items: EbaySearchResponse["itemSummaries"] = []) {
  return items
    .map((item) => {
      const title = cleanText(item.title);
      const url = item.itemWebUrl;
      if (!title || !url) {
        return null;
      }

      const price = parsePrice(item.price?.value ?? item.currentBidPrice?.value);
      return makeOffer({
        title,
        url,
        sourceLabel: "eBay",
        sourceType: "resale",
        price,
        currency: item.price?.currency ?? item.currentBidPrice?.currency ?? "USD",
        condition: cleanText(item.condition) || undefined,
        imageUrl: item.image?.imageUrl,
        merchantName: item.seller?.username,
        availability: item.buyingOptions?.join(", "),
        confidence: price ? 94 : 78,
        priceConfidence: price ? 96 : 0,
        explanation: price ? "Found through the official eBay Browse API." : "Found through eBay, but no price was returned."
      });
    })
    .filter((offer): offer is LiveOffer => Boolean(offer));
}

const ebayProvider: ProviderAdapter = {
  id: "ebay",
  label: "eBay Browse API",
  isConfigured: () => Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET),
  missingMessage: "Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET to enable live eBay offers.",
  async search({ query, limit = DEFAULT_LIMIT }) {
    const token = await getEbayAccessToken();
    const params = new URLSearchParams({
      q: query,
      limit: String(limit)
    });
    const data = await fetchJson<EbaySearchResponse>(`https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`, {
      headers: {
        authorization: `Bearer ${token}`,
        "x-ebay-c-marketplace-id": process.env.EBAY_MARKETPLACE_ID ?? "EBAY_US"
      }
    });
    return mapEbayItems(data.itemSummaries);
  },
  async lookupUrl({ url }) {
    const legacyId = extractEbayLegacyId(url);
    if (!legacyId) {
      return [];
    }

    const token = await getEbayAccessToken();
    const params = new URLSearchParams({
      legacy_item_id: legacyId
    });
    const data = await fetchJson<{ itemId?: string; title?: string; itemWebUrl?: string; image?: { imageUrl?: string }; price?: { value?: string; currency?: string }; condition?: string; seller?: { username?: string } }>(
      `https://api.ebay.com/buy/browse/v1/item/get_item_by_legacy_id?${params}`,
      {
        headers: {
          authorization: `Bearer ${token}`,
          "x-ebay-c-marketplace-id": process.env.EBAY_MARKETPLACE_ID ?? "EBAY_US"
        }
      }
    );
    return mapEbayItems([
      {
        itemId: data.itemId,
        title: data.title,
        itemWebUrl: data.itemWebUrl,
        image: data.image,
        price: data.price,
        condition: data.condition,
        seller: data.seller
      }
    ]);
  }
};

interface BestBuySearchResponse {
  products?: Array<{
    sku?: number;
    name?: string;
    salePrice?: number;
    regularPrice?: number;
    url?: string;
    image?: string;
    manufacturer?: string;
    onlineAvailability?: boolean;
    condition?: string;
  }>;
}

function mapBestBuyProducts(products: BestBuySearchResponse["products"] = []) {
  return products
    .map((product) => {
      const title = cleanText(product.name);
      const url = product.url;
      if (!title || !url) {
        return null;
      }

      const price = parsePrice(product.salePrice ?? product.regularPrice);
      return makeOffer({
        title,
        url,
        sourceLabel: "Best Buy",
        sourceType: "retail",
        price,
        condition: cleanText(product.condition) || "New",
        imageUrl: product.image,
        merchantName: "Best Buy",
        availability: product.onlineAvailability === false ? "Not available online" : "Online availability reported",
        confidence: price ? 93 : 75,
        priceConfidence: price ? 95 : 0,
        explanation: price ? "Found through the official Best Buy Product API." : "Found through Best Buy, but no price was returned."
      });
    })
    .filter((offer): offer is LiveOffer => Boolean(offer));
}

function bestBuySearchPath(query: string) {
  const terms = query
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 6);

  return terms.length > 0 ? `(${terms.map((term) => `search=${encodeURIComponent(term)}`).join("&")})` : "";
}

function extractBestBuySku(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    return url.searchParams.get("skuId") ?? url.pathname.match(/\/(\d{7,})\.p/i)?.[1];
  } catch {
    return null;
  }
}

const bestBuyProvider: ProviderAdapter = {
  id: "best-buy",
  label: "Best Buy Product API",
  isConfigured: () => Boolean(process.env.BEST_BUY_API_KEY),
  missingMessage: "Add BEST_BUY_API_KEY to enable live Best Buy product data.",
  async search({ query, limit = DEFAULT_LIMIT }) {
    const key = process.env.BEST_BUY_API_KEY;
    if (!key) {
      throw new Error("Missing Best Buy API key");
    }

    const path = bestBuySearchPath(query);
    const params = new URLSearchParams({
      apiKey: key,
      format: "json",
      pageSize: String(limit),
      show: "sku,name,salePrice,regularPrice,url,image,manufacturer,onlineAvailability,condition"
    });
    const data = await fetchJson<BestBuySearchResponse>(`https://api.bestbuy.com/v1/products${path}?${params}`);
    return mapBestBuyProducts(data.products);
  },
  async lookupUrl({ url }) {
    const key = process.env.BEST_BUY_API_KEY;
    const sku = extractBestBuySku(url);
    if (!key || !sku) {
      return [];
    }

    const params = new URLSearchParams({
      apiKey: key,
      format: "json",
      show: "sku,name,salePrice,regularPrice,url,image,manufacturer,onlineAvailability,condition"
    });
    const data = await fetchJson<BestBuySearchResponse>(`https://api.bestbuy.com/v1/products(sku=${sku})?${params}`);
    return mapBestBuyProducts(data.products);
  }
};

function extractAmazonAsin(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    return url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i)?.[1]?.toUpperCase() ?? null;
  } catch {
    return null;
  }
}

function hmac(key: Buffer | string, value: string) {
  return crypto.createHmac("sha256", key).update(value, "utf8").digest();
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function getAmazonSigningKey(secretKey: string, dateStamp: string, region: string, service: string) {
  const dateKey = hmac(`AWS4${secretKey}`, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, service);
  return hmac(serviceKey, "aws4_request");
}

async function callAmazonPaapi<T>(target: "SearchItems" | "GetItems", payload: Record<string, unknown>): Promise<T> {
  const accessKey = process.env.AMAZON_PAAPI_ACCESS_KEY;
  const secretKey = process.env.AMAZON_PAAPI_SECRET_KEY;
  const partnerTag = process.env.AMAZON_ASSOCIATE_TAG;
  if (!accessKey || !secretKey || !partnerTag) {
    throw new Error("Missing Amazon PA-API credentials");
  }

  const host = process.env.AMAZON_PAAPI_HOST ?? "webservices.amazon.com";
  const region = process.env.AMAZON_PAAPI_REGION ?? "us-east-1";
  const service = "ProductAdvertisingAPI";
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const body = JSON.stringify({
    PartnerTag: partnerTag,
    PartnerType: "Associates",
    Marketplace: process.env.AMAZON_PAAPI_MARKETPLACE ?? "www.amazon.com",
    ...payload
  });
  const canonicalHeaders = [
    "content-encoding:amz-1.0",
    "content-type:application/json; charset=utf-8",
    `host:${host}`,
    `x-amz-date:${amzDate}`,
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${target}`
  ].join("\n");
  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
  const canonicalRequest = ["POST", `/paapi5/${target.toLowerCase()}`, "", canonicalHeaders, "", signedHeaders, sha256(body)].join("\n");
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256(canonicalRequest)].join("\n");
  const signature = crypto.createHmac("sha256", getAmazonSigningKey(secretKey, dateStamp, region, service)).update(stringToSign, "utf8").digest("hex");

  return fetchJson<T>(`https://${host}/paapi5/${target.toLowerCase()}`, {
    method: "POST",
    headers: {
      authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "content-encoding": "amz-1.0",
      "content-type": "application/json; charset=utf-8",
      host,
      "x-amz-date": amzDate,
      "x-amz-target": `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${target}`
    },
    body
  });
}

interface AmazonItemsResponse {
  ItemsResult?: {
    Items?: AmazonApiItem[];
  };
  SearchResult?: {
    Items?: AmazonApiItem[];
  };
}

interface AmazonApiItem {
  ASIN?: string;
  DetailPageURL?: string;
  ItemInfo?: {
    Title?: { DisplayValue?: string };
  };
  Images?: {
    Primary?: {
      Medium?: { URL?: string };
      Large?: { URL?: string };
    };
  };
  Offers?: {
    Listings?: Array<{
      Price?: { Amount?: number; Currency?: string; DisplayAmount?: string };
      Availability?: { Message?: string };
      Condition?: { Value?: string; DisplayValue?: string };
      MerchantInfo?: { Name?: string };
    }>;
  };
}

function mapAmazonItems(items: AmazonApiItem[] = []) {
  return items
    .map((item) => {
      const title = cleanText(item.ItemInfo?.Title?.DisplayValue);
      const url = item.DetailPageURL;
      if (!title || !url) {
        return null;
      }

      const listing = item.Offers?.Listings?.[0];
      const price = parsePrice(listing?.Price?.Amount ?? listing?.Price?.DisplayAmount);
      return makeOffer({
        title,
        url,
        sourceLabel: "Amazon",
        sourceType: "retail",
        price,
        currency: listing?.Price?.Currency ?? "USD",
        condition: cleanText(listing?.Condition?.DisplayValue ?? listing?.Condition?.Value) || "New",
        imageUrl: item.Images?.Primary?.Large?.URL ?? item.Images?.Primary?.Medium?.URL,
        merchantName: listing?.MerchantInfo?.Name ?? "Amazon",
        availability: listing?.Availability?.Message,
        confidence: price ? 94 : 74,
        priceConfidence: price ? 95 : 0,
        explanation: price ? "Found through Amazon Product Advertising API." : "Found through Amazon, but no offer price was returned."
      });
    })
    .filter((offer): offer is LiveOffer => Boolean(offer));
}

const amazonProvider: ProviderAdapter = {
  id: "amazon",
  label: "Amazon Product Advertising API",
  isConfigured: () =>
    Boolean(process.env.AMAZON_PAAPI_ACCESS_KEY && process.env.AMAZON_PAAPI_SECRET_KEY && process.env.AMAZON_ASSOCIATE_TAG),
  missingMessage: "Add Amazon PA-API credentials and AMAZON_ASSOCIATE_TAG to enable reliable Amazon data.",
  async search({ query, limit = DEFAULT_LIMIT }) {
    const data = await callAmazonPaapi<AmazonItemsResponse>("SearchItems", {
      Keywords: query,
      ItemCount: Math.min(limit, 10),
      Resources: [
        "Images.Primary.Medium",
        "Images.Primary.Large",
        "ItemInfo.Title",
        "Offers.Listings.Price",
        "Offers.Listings.Availability.Message",
        "Offers.Listings.Condition",
        "Offers.Listings.MerchantInfo"
      ]
    });
    return mapAmazonItems(data.SearchResult?.Items);
  },
  async lookupUrl({ url }) {
    const asin = extractAmazonAsin(url);
    if (!asin) {
      return [];
    }

    const data = await callAmazonPaapi<AmazonItemsResponse>("GetItems", {
      ItemIds: [asin],
      Resources: [
        "Images.Primary.Medium",
        "Images.Primary.Large",
        "ItemInfo.Title",
        "Offers.Listings.Price",
        "Offers.Listings.Availability.Message",
        "Offers.Listings.Condition",
        "Offers.Listings.MerchantInfo"
      ]
    });
    return mapAmazonItems(data.ItemsResult?.Items);
  }
};

interface WalmartSearchResponse {
  items?: Array<{
    itemId?: string;
    productName?: string;
    price?: { amount?: number; currency?: string };
    salePrice?: number;
    msrp?: number;
    productUrl?: string;
    url?: string;
    imageUrl?: string;
    availability?: string;
    condition?: string;
    sellerName?: string;
  }>;
}

function mapWalmartItems(items: WalmartSearchResponse["items"] = []) {
  return items
    .map((item) => {
      const title = cleanText(item.productName);
      const url = item.productUrl ?? item.url;
      if (!title || !url) {
        return null;
      }

      const price = parsePrice(item.price?.amount ?? item.salePrice ?? item.msrp);
      return makeOffer({
        title,
        url,
        sourceLabel: "Walmart",
        sourceType: "retail",
        price,
        currency: item.price?.currency ?? "USD",
        condition: cleanText(item.condition) || "New",
        imageUrl: item.imageUrl,
        merchantName: item.sellerName ?? "Walmart",
        availability: item.availability,
        confidence: price ? 90 : 70,
        priceConfidence: price ? 92 : 0,
        explanation: price ? "Found through Walmart catalog data." : "Found through Walmart, but no price was returned."
      });
    })
    .filter((offer): offer is LiveOffer => Boolean(offer));
}

const walmartProvider: ProviderAdapter = {
  id: "walmart",
  label: "Walmart Catalog API",
  isConfigured: () => Boolean(process.env.WALMART_SEARCH_ENDPOINT && (process.env.WALMART_API_KEY || process.env.WALMART_ACCESS_TOKEN)),
  missingMessage: "Add WALMART_SEARCH_ENDPOINT plus Walmart catalog/API credentials to enable live Walmart offers.",
  async search({ query, limit = DEFAULT_LIMIT }) {
    const apiKey = process.env.WALMART_API_KEY;
    const accessToken = process.env.WALMART_ACCESS_TOKEN;
    const params = new URLSearchParams({
      query,
      limit: String(limit)
    });
    const data = await fetchJson<WalmartSearchResponse>(
      `${process.env.WALMART_SEARCH_ENDPOINT}?${params}`,
      {
        headers: {
          ...(apiKey ? { "WM_CONSUMER.ID": apiKey } : {}),
          ...(accessToken ? { "WM_SEC.ACCESS_TOKEN": accessToken } : {})
        }
      }
    );
    return mapWalmartItems(data.items);
  }
};

const providers: ProviderAdapter[] = [ebayProvider, bestBuyProvider, amazonProvider, walmartProvider];

async function runProvider(
  provider: ProviderAdapter,
  mode: "search" | "lookup",
  options: SearchOptions | LookupOptions
): Promise<ProviderResult> {
  if (!provider.isConfigured()) {
    return {
      offers: [],
      status: status(provider, "missing_config", provider.missingMessage)
    };
  }

  const handler = mode === "search" ? provider.search : provider.lookupUrl;
  if (!handler) {
    return {
      offers: [],
      status: status(provider, "skipped", `${provider.label} does not support ${mode === "search" ? "search" : "URL lookup"} yet.`)
    };
  }

  try {
    const offers = await handler(options as SearchOptions & LookupOptions);
    return {
      offers,
      status: status(
        provider,
        "configured",
        offers.length > 0 ? `${provider.label} returned ${offers.length} live offer${offers.length === 1 ? "" : "s"}.` : `${provider.label} returned no matching offers.`
      )
    };
  } catch (error) {
    return {
      offers: [],
      status: status(provider, "error", error instanceof Error ? error.message : `${provider.label} failed.`)
    };
  }
}

function sortOffers(offers: LiveOffer[]) {
  return [...offers].sort((a, b) => {
    const aScore = a.confidence + (a.price ? 8 : 0);
    const bScore = b.confidence + (b.price ? 8 : 0);
    return bScore - aScore;
  });
}

export async function searchLiveOffers({ query, limit = DEFAULT_LIMIT }: SearchOptions) {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      offers: [],
      providerStatuses: providers.map((provider) => status(provider, "skipped", "Enter a product name to search live offers."))
    };
  }

  const results = await Promise.all(providers.map((provider) => runProvider(provider, "search", { query: trimmed, limit })));
  return {
    offers: sortOffers(results.flatMap((result) => result.offers)).slice(0, limit * 2),
    providerStatuses: results.map((result) => result.status)
  };
}

export async function lookupLiveOfferByUrl(rawUrl: string) {
  const source = getSourceLabel(rawUrl, "Unknown source");
  const likelyProviders = providers.filter((provider) => {
    const id = provider.id.toLowerCase();
    return source.toLowerCase().includes(id.replace("-", " ")) || rawUrl.toLowerCase().includes(id.replace("-", ""));
  });
  const candidates = likelyProviders.length > 0 ? likelyProviders : providers;
  const results = await Promise.all(candidates.map((provider) => runProvider(provider, "lookup", { url: rawUrl })));

  return {
    offer: sortOffers(results.flatMap((result) => result.offers))[0],
    providerStatuses: results.map((result) => result.status)
  };
}

export function liveOfferToExtraction(offer: LiveOffer) {
  return {
    title: offer.title,
    description: [
      offer.merchantName ? `Merchant: ${offer.merchantName}` : "",
      offer.condition ? `Condition: ${offer.condition}` : "",
      offer.availability ? `Availability: ${offer.availability}` : "",
      offer.explanation
    ]
      .filter(Boolean)
      .join("\n"),
    price: offer.price,
    priceConfidence: offer.priceConfidence,
    priceSource: offer.explanation,
    priceExplanation: offer.price
      ? `Detected ${offer.sourceLabel} official API price: ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: offer.currency ?? "USD",
          maximumFractionDigits: offer.price % 1 === 0 ? 0 : 2
        }).format(offer.price)}.`
      : "The official provider did not return a reliable price.",
    productName: offer.title,
    sourceLabel: offer.sourceLabel,
    sourceDomain: offer.sourceDomain,
    mode: offer.sourceType,
    confidence: offer.confidence
  };
}

export function offerToListingAlternative(offer: LiveOffer) {
  return {
    productId: offer.id,
    title: offer.title,
    price: offer.price ?? 0,
    priceLabel: offer.sourceLabel,
    sourceType: offer.sourceType,
    actionLabel: offer.sourceType === "retail" ? "Compare retail price" : "Check resale option",
    outcome: offer.url,
    reason: offer.explanation
  };
}

export function sourceTypeFromOfferUrl(url: string): LinkAnalysisMode {
  return inferAnalysisModeFromUrl(url) ?? "retail";
}
