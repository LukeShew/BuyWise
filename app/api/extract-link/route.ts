import dns from "dns/promises";
import net from "net";
import { NextResponse } from "next/server";

import { mockProducts } from "@/data/mockProducts";
import {
  getSourceDomain,
  getSourceLabel,
  inferAnalysisModeFromUrl,
  inferMarketplaceFromUrl
} from "@/lib/linkAnalysis";
import type { LinkExtractionResult, Product } from "@/types";

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
    return url;
  } catch {
    return null;
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
  if (!Number.isFinite(price) || price < 10 || price > 50_000) {
    return null;
  }

  return price;
}

function getStructuredPrice(html: string) {
  const metaPrice = getMetaContent(html, [
    "product:price:amount",
    "og:price:amount",
    "twitter:data1",
    "price",
    "sale_price"
  ]);
  const parsedMetaPrice = parsePrice(metaPrice);
  if (parsedMetaPrice) {
    return parsedMetaPrice;
  }

  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const rawJson = cleanText(match[1]);
    if (!rawJson) {
      continue;
    }

    try {
      const value = JSON.parse(rawJson) as unknown;
      const price = findJsonPrice(value);
      if (price) {
        return price;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function findJsonPrice(value: unknown): number | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const price = findJsonPrice(item);
      if (price) {
        return price;
      }
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  const directPrice = parsePrice(record.price ?? record.lowPrice ?? record.highPrice);
  if (directPrice) {
    return directPrice;
  }

  const offers = record.offers;
  if (offers) {
    const offerPrice = findJsonPrice(offers);
    if (offerPrice) {
      return offerPrice;
    }
  }

  const graph = record["@graph"];
  if (graph) {
    const graphPrice = findJsonPrice(graph);
    if (graphPrice) {
      return graphPrice;
    }
  }

  return null;
}

function getFallbackPrice(html: string) {
  const bodyText = cleanText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );

  const candidates = Array.from(bodyText.matchAll(/(?:US\s*)?\$\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi))
    .map((match) => parsePrice(match[1]))
    .filter((price): price is number => Boolean(price));

  if (!candidates.length) {
    return null;
  }

  return candidates[0];
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

function normalizeForMatch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function productLabel(product: Product) {
  return `${product.brand} ${product.model}`;
}

function findMatchingProduct(title: string, description: string) {
  const haystack = normalizeForMatch(`${title} ${description}`);

  return mockProducts.find((product) => {
    const fullName = normalizeForMatch(productLabel(product));
    const model = normalizeForMatch(product.model);
    return haystack.includes(fullName) || haystack.includes(model);
  });
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
        confidence: 20,
        message: "This site did not return a readable product page. Add the key details manually."
      });
    }

    const html = await readLimitedText(response);
    const structuredInfo = getStructuredNameAndDescription(html);
    const title = structuredInfo.name || getTitle(html);
    const description = structuredInfo.description || getDescription(html);
    const price = getStructuredPrice(html) ?? getFallbackPrice(html);
    const matchedProduct = findMatchingProduct(title, description);
    const confidence =
      30 +
      (title ? 20 : 0) +
      (description ? 10 : 0) +
      (price ? 20 : 0) +
      (matchedProduct ? 15 : 0) +
      (sourceDomain ? 5 : 0);

    return buildResponse({
      ok: Boolean(title || description || price),
      manualRequired: !price || !matchedProduct,
      url: normalizedUrl,
      sourceLabel,
      sourceDomain,
      mode,
      marketplace,
      title: title || undefined,
      description: description || undefined,
      price: price ?? undefined,
      productName: matchedProduct ? productLabel(matchedProduct) : undefined,
      confidence: Math.min(confidence, 90),
      message:
        price && matchedProduct
          ? "Pulled product details from the link. Check them before analyzing."
          : "Pulled what was available. Add any missing price or product details before analyzing.",
      warnings: [
        !price ? "No reliable price was found on the page." : "",
        !matchedProduct ? "No exact mock-catalog product match was found." : ""
      ].filter(Boolean)
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
      confidence: 15,
      message: "This site blocked or timed out during link reading. Paste the listing details manually."
    });
  }
}
