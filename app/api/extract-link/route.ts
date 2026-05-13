import dns from "dns/promises";
import net from "net";
import { NextResponse } from "next/server";

import {
  getSourceDomain,
  getSourceLabel,
  inferAnalysisModeFromUrl,
  inferMarketplaceFromUrl
} from "@/lib/linkAnalysis";
import { liveOfferToExtraction, lookupLiveOfferByUrl } from "@/services/liveOfferService";
import type { LinkExtractionResult } from "@/types";

export const runtime = "nodejs";

const MAX_HTML_BYTES = 750_000;
const REQUEST_TIMEOUT_MS = 7000;

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    const nestedUrl = getNestedRedirectUrl(url);
    if (nestedUrl) {
      return nestedUrl;
    }

    normalizeHostname(url);
    removeTrackingParams(url);
    return url;
  } catch {
    return null;
  }
}

function normalizeHostname(url: URL) {
  url.hostname = url.hostname.toLowerCase().replace(/^m\./, "www.").replace(/^mobile\./, "www.");
}

function getNestedRedirectUrl(url: URL) {
  const redirectKeys = ["url", "u", "redirect", "redirect_url", "redirectUrl", "target", "to"];
  for (const key of redirectKeys) {
    const value = url.searchParams.get(key);
    if (!value) {
      continue;
    }

    try {
      const decoded = decodeURIComponent(value);
      if (/^https?:\/\//i.test(decoded)) {
        const nested = new URL(decoded);
        if (nested.protocol === "http:" || nested.protocol === "https:") {
          normalizeHostname(nested);
          removeTrackingParams(nested);
          return nested;
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

function removeTrackingParams(url: URL) {
  const trackingKeys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fbclid",
    "gclid",
    "msclkid",
    "igshid",
    "mc_cid",
    "mc_eid",
    "ref",
    "ref_",
    "tag",
    "ascsubtag",
    "psc"
  ];

  for (const key of Array.from(url.searchParams.keys())) {
    if (trackingKeys.includes(key) || key.startsWith("utm_")) {
      url.searchParams.delete(key);
    }
  }
}

function isPrivateIp(address: string) {
  const family = net.isIP(address);

  if (family === 4) {
    const parts = address.split(".").map(Number);
    const [first, second] = parts;

    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    );
  }

  if (family === 6) {
    const lower = address.toLowerCase();
    return lower === "::" || lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80");
  }

  return false;
}

async function assertPublicTarget(url: URL) {
  const hostname = url.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    isPrivateIp(hostname)
  ) {
    throw new Error("That link points to a private or local address.");
  }

  const addresses = await dns.lookup(hostname, { all: true });
  if (addresses.some((address) => isPrivateIp(address.address))) {
    throw new Error("That link resolves to a private or local address.");
  }
}

function isFacebookHost(url: URL) {
  const hostname = url.hostname.toLowerCase();
  return hostname.includes("facebook.") || hostname === "fb.com" || hostname.endsWith(".fb.com");
}

function decodeEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: "\""
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#x")) {
      return String.fromCharCode(Number.parseInt(entity.slice(2), 16));
    }

    if (entity.startsWith("#")) {
      return String.fromCharCode(Number.parseInt(entity.slice(1), 10));
    }

    return namedEntities[entity.toLowerCase()] ?? match;
  });
}

function cleanText(value?: string | null) {
  if (!value) {
    return "";
  }

  return decodeEntities(value)
    .replace(/\s+/g, " ")
    .replace(/\u0000/g, "")
    .trim();
}

function getAttribute(tag: string, name: string) {
  const quoted = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  if (quoted?.[1]) {
    return cleanText(quoted[1]);
  }

  const unquoted = tag.match(new RegExp(`${name}\\s*=\\s*([^\\s>]+)`, "i"));
  return cleanText(unquoted?.[1]);
}

function getMetaContent(html: string, keys: string[]) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const name = getAttribute(tag, "name").toLowerCase();
    const property = getAttribute(tag, "property").toLowerCase();
    const itemProp = getAttribute(tag, "itemprop").toLowerCase();

    if (keys.some((key) => key === name || key === property || key === itemProp)) {
      const content = getAttribute(tag, "content");
      if (content) {
        return content;
      }
    }
  }

  return "";
}

function getTitle(html: string) {
  const ogTitle = getMetaContent(html, ["og:title", "twitter:title"]);
  if (ogTitle) {
    return ogTitle;
  }

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return cleanText(title);
}

function getDescription(html: string) {
  return getMetaContent(html, ["og:description", "twitter:description", "description"]);
}

interface PriceCandidate {
  price: number;
  source: string;
  confidence: number;
  context: string;
}

interface PriceExtraction {
  price?: number;
  confidence: number;
  source: string;
  explanation: string;
  warnings: string[];
}

function parsePrice(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const match = value.replace(/,/g, "").match(/([0-9]+(?:\.[0-9]{1,2})?)/);
  if (!match) {
    return null;
  }

  const price = Number.parseFloat(match[1]);
  if (!Number.isFinite(price) || price < 1 || price > 100_000) {
    return null;
  }

  return price;
}

function getPageText(html: string) {
  return cleanText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function getExpectedMinimumPrice(productText: string) {
  const normalized = productText.toLowerCase();

  if (/(macbook|laptop|iphone|ipad|surface|thinkpad|xps)/.test(normalized)) {
    return 100;
  }

  if (/(camera|mirrorless|dslr|lens)/.test(normalized)) {
    return 60;
  }

  if (/(bike|bicycle|trek|specialized|giant|cannondale)/.test(normalized)) {
    return 60;
  }

  if (/(monitor|ultrasharp|odyssey|proart)/.test(normalized)) {
    return 40;
  }

  if (/(playstation|xbox|nintendo|console|stockx|goat|sneaker|shoe)/.test(normalized)) {
    return 25;
  }

  return 10;
}

function hasBadPriceContext(context: string) {
  return /shipping|delivery|coupon|promo|discount|save\s+\$|monthly|\/mo|per month|month|financ|affirm|klarna|afterpay|payment|installment|trade[\s-]?in|protection plan|warranty plan|gift card|accessor|case|charger|cable|suggested|sponsored|related|carousel|compare|list price|was\s+\$|regular price|strike|crossed|starting at/i.test(
    context
  );
}

function hasStrongPriceContext(context: string) {
  return /buy box|current price|sale price|deal price|now\s+\$|price\s+\$|our price|itemprice|product price|offer price|final price/i.test(
    context
  );
}

function adjustCandidateConfidence(candidate: PriceCandidate, productText: string) {
  let confidence = candidate.confidence;
  const minimum = getExpectedMinimumPrice(productText);

  if (candidate.price < minimum) {
    confidence -= 45;
  }

  if (hasBadPriceContext(candidate.context)) {
    confidence -= 55;
  }

  if (hasStrongPriceContext(candidate.context)) {
    confidence += 10;
  }

  return {
    ...candidate,
    confidence: Math.max(0, Math.min(98, Math.round(confidence)))
  };
}

function getMetaPriceCandidates(html: string): PriceCandidate[] {
  const keys = [
    { key: "product:price:amount", source: "OpenGraph product price", confidence: 84 },
    { key: "og:price:amount", source: "OpenGraph price", confidence: 78 },
    { key: "price", source: "page price metadata", confidence: 66 },
    { key: "sale_price", source: "sale price metadata", confidence: 68 },
    { key: "twitter:data1", source: "Twitter card price hint", confidence: 46 }
  ];

  return keys
    .map((item) => {
      const price = parsePrice(getMetaContent(html, [item.key]));
      return price
        ? {
            price,
            source: item.source,
            confidence: item.confidence,
            context: item.key
          }
        : null;
    })
    .filter((candidate): candidate is PriceCandidate => Boolean(candidate));
}

function getStructuredPriceCandidates(html: string): PriceCandidate[] {
  const candidates: PriceCandidate[] = [];

  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const rawJson = cleanText(match[1]);
    if (!rawJson) {
      continue;
    }

    try {
      const value = JSON.parse(rawJson) as unknown;
      candidates.push(...findJsonPriceCandidates(value));
    } catch {
      continue;
    }
  }

  return candidates;
}

function findJsonPriceCandidates(value: unknown, context = ""): PriceCandidate[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => findJsonPriceCandidates(item, context));
  }

  const record = value as Record<string, unknown>;
  const type = Array.isArray(record["@type"]) ? record["@type"].join(" ") : String(record["@type"] ?? "");
  const nextContext = `${context} ${type}`.trim();
  const isProductOrOffer = /product|offer|pricespecification/i.test(nextContext);
  const candidates: PriceCandidate[] = [];

  if (isProductOrOffer) {
    const price = parsePrice(record.price ?? record.salePrice ?? record.currentPrice ?? record.offerPrice ?? record.finalPrice);
    if (price) {
      candidates.push({
        price,
        source: /offer/i.test(nextContext) ? "JSON-LD offer price" : "JSON-LD product price",
        confidence: /offer/i.test(nextContext) ? 88 : 76,
        context: nextContext
      });
    }

    const lowPrice = parsePrice(record.lowPrice);
    const highPrice = parsePrice(record.highPrice);
    if (lowPrice && highPrice && lowPrice === highPrice) {
      candidates.push({
        price: lowPrice,
        source: "JSON-LD offer range",
        confidence: 80,
        context: nextContext
      });
    }
  }

  const priceSpecification = record.priceSpecification;
  if (priceSpecification) {
    candidates.push(...findJsonPriceCandidates(priceSpecification, `${nextContext} PriceSpecification`));
  }

  const offers = record.offers;
  if (offers) {
    candidates.push(...findJsonPriceCandidates(offers, `${nextContext} Offer`));
  }

  const graph = record["@graph"];
  if (graph) {
    candidates.push(...findJsonPriceCandidates(graph, nextContext));
  }

  return candidates;
}

function getEmbeddedJsonPriceCandidates(html: string) {
  return Array.from(
    html.matchAll(/"(?:price|currentPrice|salePrice|offerPrice|finalPrice|discountedPrice)"\s*:\s*"?\$?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)"?/gi)
  )
    .map((match): PriceCandidate | null => {
      const price = parsePrice(match[1]);
      if (!price) {
        return null;
      }

      const index = match.index ?? 0;
      return {
        price,
        source: "embedded page data",
        confidence: 52,
        context: cleanText(html.slice(Math.max(0, index - 90), index + 120))
      };
    })
    .filter((candidate): candidate is PriceCandidate => Boolean(candidate));
}

function getDataAttributePriceCandidates(html: string) {
  return Array.from(html.matchAll(/\bdata-(?:price|amount|sale-price|current-price)=["']\$?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)["']/gi))
    .map((match): PriceCandidate | null => {
      const price = parsePrice(match[1]);
      if (!price) {
        return null;
      }

      return {
        price,
        source: "structured page price attribute",
        confidence: 70,
        context: match[0]
      };
    })
    .filter((candidate): candidate is PriceCandidate => Boolean(candidate));
}

function getVisiblePriceCandidates(html: string) {
  const bodyText = getPageText(html);

  return Array.from(bodyText.matchAll(/(?:US\s*)?\$\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi))
    .map((match): PriceCandidate | null => {
      const price = parsePrice(match[1]);
      if (!price) {
        return null;
      }

      const index = match.index ?? 0;
      return {
        price,
        source: "visible page text",
        confidence: 44,
        context: bodyText.slice(Math.max(0, index - 80), index + 110)
      };
    })
    .filter((candidate): candidate is PriceCandidate => Boolean(candidate));
}

function extractPrice(html: string, productText: string): PriceExtraction {
  const rawCandidates = [
    ...getStructuredPriceCandidates(html),
    ...getMetaPriceCandidates(html),
    ...getDataAttributePriceCandidates(html),
    ...getEmbeddedJsonPriceCandidates(html),
    ...getVisiblePriceCandidates(html)
  ];
  const adjusted = rawCandidates
    .map((candidate) => adjustCandidateConfidence(candidate, productText))
    .sort((a, b) => b.confidence - a.confidence || a.price - b.price);
  const best = adjusted[0];

  if (!best) {
    return {
      confidence: 0,
      source: "No price found",
      explanation: "No readable product price was found in the page metadata or visible text.",
      warnings: ["Confirm the listing price manually before scoring."]
    };
  }

  if (best.confidence < 65) {
    return {
      confidence: best.confidence,
      source: best.source,
      explanation:
        best.price < getExpectedMinimumPrice(productText)
          ? `A possible ${formatMoney(best.price)} price was found, but it looks too low for this product and may be shipping, financing, or unrelated page text.`
          : `A possible ${formatMoney(best.price)} price was found in ${best.source}, but the surrounding page text was not reliable enough to score from it.`,
      warnings: ["Confirm the listing price manually before scoring."]
    };
  }

  return {
    price: best.price,
    confidence: best.confidence,
    source: best.source,
    explanation: `Detected ${best.source}: ${formatMoney(best.price)}.`,
    warnings: []
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2
  }).format(value);
}

function getStructuredNameAndDescription(html: string) {
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const value = JSON.parse(cleanText(match[1])) as unknown;
      const result = findJsonProductInfo(value);
      if (result.name || result.description) {
        return result;
      }
    } catch {
      continue;
    }
  }

  return { name: "", description: "" };
}

function typeIncludesProduct(type: unknown): boolean {
  if (typeof type === "string") {
    return type.toLowerCase().includes("product");
  }

  if (Array.isArray(type)) {
    return type.some((item) => typeIncludesProduct(item));
  }

  return false;
}

function findJsonProductInfo(value: unknown): { name: string; description: string } {
  if (!value || typeof value !== "object") {
    return { name: "", description: "" };
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = findJsonProductInfo(item);
      if (result.name || result.description) {
        return result;
      }
    }
    return { name: "", description: "" };
  }

  const record = value as Record<string, unknown>;
  if (typeIncludesProduct(record["@type"])) {
    return {
      name: typeof record.name === "string" ? cleanText(record.name) : "",
      description: typeof record.description === "string" ? cleanText(record.description) : ""
    };
  }

  const graph = record["@graph"];
  if (graph) {
    return findJsonProductInfo(graph);
  }

  return { name: "", description: "" };
}

async function readLimitedText(response: Response) {
  if (!response.body) {
    return response.text();
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (received < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) {
      break;
    }

    chunks.push(value);
    received += value.byteLength;
  }

  await reader.cancel().catch(() => undefined);
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
}

function buildResponse(result: LinkExtractionResult, status = 200) {
  return NextResponse.json(result, { status });
}

export async function POST(request: Request) {
  let rawUrl = "";

  try {
    const body = (await request.json()) as { url?: string };
    rawUrl = body.url ?? "";
  } catch {
    return buildResponse(
      {
        ok: false,
        manualRequired: true,
        url: "",
        sourceLabel: "Unknown source",
        confidence: 0,
        message: "Paste a valid product or listing link."
      },
      400
    );
  }

  const url = normalizeUrl(rawUrl);
  if (!url) {
    return buildResponse(
      {
        ok: false,
        manualRequired: true,
        url: rawUrl,
        sourceLabel: "Unknown source",
        confidence: 0,
        message: "Paste a valid product or listing link."
      },
      400
    );
  }

  const normalizedUrl = url.toString();
  const sourceLabel = getSourceLabel(normalizedUrl, "Unknown source");
  const sourceDomain = getSourceDomain(normalizedUrl);
  const mode = inferAnalysisModeFromUrl(normalizedUrl) ?? "resale";
  const marketplace = inferMarketplaceFromUrl(normalizedUrl) ?? undefined;

  if (isFacebookHost(url)) {
    return buildResponse({
      ok: false,
      manualRequired: true,
      url: normalizedUrl,
      sourceLabel,
      sourceDomain,
      mode: "resale",
      marketplace: "Facebook Marketplace",
      confidence: 25,
      message: "Facebook Marketplace links are not fetched. Paste the title, price, and description instead."
    });
  }

  try {
    await assertPublicTarget(url);
  } catch (error) {
    return buildResponse(
      {
        ok: false,
        manualRequired: true,
        url: normalizedUrl,
        sourceLabel,
        sourceDomain,
        mode,
        marketplace,
        confidence: 0,
        message: error instanceof Error ? error.message : "That link cannot be safely fetched."
      },
      400
    );
  }

  const providerLookup = await lookupLiveOfferByUrl(normalizedUrl);
  if (providerLookup.offer?.price) {
    const extraction = liveOfferToExtraction(providerLookup.offer);
    return buildResponse({
      ok: true,
      manualRequired: false,
      url: providerLookup.offer.url,
      sourceLabel: extraction.sourceLabel,
      sourceDomain: extraction.sourceDomain,
      mode: extraction.mode,
      marketplace: marketplace,
      title: extraction.title,
      description: extraction.description,
      price: extraction.price,
      priceConfidence: extraction.priceConfidence,
      priceSource: extraction.priceSource,
      priceExplanation: extraction.priceExplanation,
      productName: extraction.productName,
      matchCandidates: [],
      liveOffer: providerLookup.offer,
      providerStatuses: providerLookup.providerStatuses,
      confidence: extraction.confidence,
      message: "Pulled product and price details from an official provider API.",
      warnings: providerLookup.offer.warnings
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent": "BuyWiseLinkPreview/1.0 (+https://buywise.local)"
      },
      redirect: "follow",
      signal: controller.signal
    });

    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.toLowerCase().includes("text/html")) {
      return buildResponse({
        ok: false,
        manualRequired: true,
        url: normalizedUrl,
        sourceLabel,
        sourceDomain,
        mode,
        marketplace,
        providerStatuses: providerLookup.providerStatuses,
        confidence: 20,
        message: "This site did not return a readable product page. Add the key details manually."
      });
    }

    const finalUrl = response.url || normalizedUrl;
    const finalSourceLabel = getSourceLabel(finalUrl, sourceLabel);
    const finalSourceDomain = getSourceDomain(finalUrl) || sourceDomain;
    const finalMode = inferAnalysisModeFromUrl(finalUrl) ?? mode;
    const finalMarketplace = inferMarketplaceFromUrl(finalUrl) ?? marketplace;
    const html = await readLimitedText(response);
    const structuredInfo = getStructuredNameAndDescription(html);
    const title = structuredInfo.name || getTitle(html);
    const description = structuredInfo.description || getDescription(html);
    const productText = [title, description, finalUrl].filter(Boolean).join(" ");
    const price = extractPrice(html, productText);
    const confidence =
      30 +
      (title ? 20 : 0) +
      (description ? 10 : 0) +
      (price.price ? Math.round(price.confidence * 0.18) : 0) +
      (finalSourceDomain ? 5 : 0);

    const manualWarnings = [
      ...price.warnings,
      price.price ? "" : "BuyWise needs the listing price confirmed before scoring.",
      title ? "" : "BuyWise could not find a reliable page title."
    ].filter(Boolean);

    return buildResponse({
      ok: Boolean(title || description || price.price),
      manualRequired: !price.price || !title,
      url: finalUrl,
      sourceLabel: finalSourceLabel,
      sourceDomain: finalSourceDomain || undefined,
      mode: finalMode,
      marketplace: finalMarketplace,
      title: title || undefined,
      description: description || undefined,
      price: price.price,
      priceConfidence: price.confidence,
      priceSource: price.source,
      priceExplanation: price.explanation,
      productName: title || undefined,
      matchCandidates: [],
      liveOffer: providerLookup.offer,
      providerStatuses: providerLookup.providerStatuses,
      confidence: Math.min(confidence, 90),
      message:
        price.price && title
          ? "Pulled readable product and price details. Check them before analyzing."
          : "BuyWise pulled what it could, but needs the missing title or price confirmed before scoring.",
      warnings: manualWarnings
    });
  } catch {
    clearTimeout(timeout);

    return buildResponse({
      ok: false,
      manualRequired: true,
      url: normalizedUrl,
      sourceLabel,
      sourceDomain,
      mode,
      marketplace,
      providerStatuses: providerLookup.providerStatuses,
      confidence: 15,
      message: "This site blocked or timed out during link reading. Paste the listing details manually."
    });
  }
}
