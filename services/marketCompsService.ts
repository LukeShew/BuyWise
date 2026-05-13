import crypto from "crypto";

export interface MarketComp {
  id: string;
  title: string;
  price: number;
  source: string;
  condition?: string;
  imageUrl?: string;
  url?: string;
}

export interface MarketCompsResult {
  comps: MarketComp[];
  fairPrice?: number;
  low?: number;
  high?: number;
  confidence: number;
  providers: string[];
}

const REQUEST_TIMEOUT_MS = 8000;

function hashId(value: string) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 18);
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

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function makeComp({
  title,
  price,
  source,
  condition,
  imageUrl,
  url
}: {
  title: string;
  price?: number;
  source: string;
  condition?: string;
  imageUrl?: string;
  url?: string;
}): MarketComp | null {
  if (!title || !price) {
    return null;
  }

  return {
    id: hashId(`${source}:${title}:${price}:${url ?? ""}`),
    title,
    price,
    source,
    condition,
    imageUrl,
    url
  };
}

async function getEbayToken() {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return null;
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetchJson<{ access_token?: string }>("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      authorization: `Basic ${auth}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "https://api.ebay.com/oauth/api_scope"
    })
  });

  return response.access_token ?? null;
}

async function searchEbay(query: string): Promise<MarketComp[]> {
  const token = await getEbayToken();
  if (!token) {
    return [];
  }

  const params = new URLSearchParams({ q: query, limit: "8" });
  const data = await fetchJson<{
    itemSummaries?: Array<{
      title?: string;
      itemWebUrl?: string;
      image?: { imageUrl?: string };
      price?: { value?: string };
      currentBidPrice?: { value?: string };
      condition?: string;
    }>;
  }>(`https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`, {
    headers: {
      authorization: `Bearer ${token}`,
      "x-ebay-c-marketplace-id": process.env.EBAY_MARKETPLACE_ID ?? "EBAY_US"
    }
  });

  return (data.itemSummaries ?? [])
    .map((item) =>
      makeComp({
        title: cleanText(item.title),
        price: parsePrice(item.price?.value ?? item.currentBidPrice?.value),
        source: "eBay",
        condition: cleanText(item.condition) || undefined,
        imageUrl: item.image?.imageUrl,
        url: item.itemWebUrl
      })
    )
    .filter((comp): comp is MarketComp => Boolean(comp));
}

async function searchBestBuy(query: string): Promise<MarketComp[]> {
  const key = process.env.BEST_BUY_API_KEY;
  if (!key) {
    return [];
  }

  const terms = query
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 6);
  const path = terms.length > 0 ? `(${terms.map((term) => `search=${encodeURIComponent(term)}`).join("&")})` : "";
  const params = new URLSearchParams({
    apiKey: key,
    format: "json",
    pageSize: "8",
    show: "name,salePrice,regularPrice,url,image,condition"
  });
  const data = await fetchJson<{
    products?: Array<{
      name?: string;
      salePrice?: number;
      regularPrice?: number;
      url?: string;
      image?: string;
      condition?: string;
    }>;
  }>(`https://api.bestbuy.com/v1/products${path}?${params}`);

  return (data.products ?? [])
    .map((product) =>
      makeComp({
        title: cleanText(product.name),
        price: parsePrice(product.salePrice ?? product.regularPrice),
        source: "Best Buy",
        condition: cleanText(product.condition) || "New",
        imageUrl: product.image,
        url: product.url
      })
    )
    .filter((comp): comp is MarketComp => Boolean(comp));
}

export async function getMarketComps(query: string): Promise<MarketCompsResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { comps: [], confidence: 0, providers: [] };
  }

  const settled = await Promise.allSettled([searchEbay(trimmed), searchBestBuy(trimmed)]);
  const comps = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const prices = comps.map((comp) => comp.price).sort((a, b) => a - b);
  const providers = [...new Set(comps.map((comp) => comp.source))];

  if (prices.length < 3) {
    return {
      comps,
      confidence: prices.length > 0 ? 38 : 0,
      providers
    };
  }

  const lowIndex = Math.max(0, Math.floor(prices.length * 0.2));
  const highIndex = Math.min(prices.length - 1, Math.ceil(prices.length * 0.8) - 1);
  const middle = prices.slice(lowIndex, highIndex + 1);
  const fairPrice = Math.round(middle.reduce((sum, price) => sum + price, 0) / middle.length);

  return {
    comps,
    fairPrice,
    low: Math.round(prices[lowIndex]),
    high: Math.round(prices[highIndex]),
    confidence: Math.min(88, 48 + prices.length * 7 + providers.length * 8),
    providers
  };
}
