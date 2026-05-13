import crypto from "crypto";
import { NextResponse } from "next/server";

import { calculateDealQuality } from "@/lib/dealQuality";
import { formatCurrency } from "@/lib/format";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabaseAdmin";
import { getMarketComps } from "@/services/marketCompsService";
import type { DealContext, ListingAnalysisContext, PhotoAnalysisApiResponse, PhotoAnalysisExtract, PublicPhotoProduct } from "@/types";

export const runtime = "nodejs";

const MAX_FILES = 6;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const STORAGE_BUCKET = "buywise-photo-uploads";

function json(response: PhotoAnalysisApiResponse, status = 200) {
  return NextResponse.json(response, { status });
}

function parseManualPrice(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const price = Number.parseFloat(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(price) && price > 0 && price < 100_000 ? price : undefined;
}

function marketplaceFromSource(source?: string) {
  const normalized = source?.toLowerCase() ?? "";
  if (normalized.includes("ebay")) return "eBay" as const;
  if (normalized.includes("craigslist")) return "Craigslist" as const;
  if (normalized.includes("facebook")) return "Facebook Marketplace" as const;
  if (normalized.includes("offerup")) return "OfferUp" as const;
  return "Other" as const;
}

async function fileToDataUrl(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

async function analyzeWithOpenAI(files: File[], notes: string, manualPrice?: number): Promise<PhotoAnalysisExtract> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI photo analysis is not configured. Add OPENAI_API_KEY.");
  }

  const imageContent = await Promise.all(files.map(async (file) => ({
    type: "input_image",
    image_url: await fileToDataUrl(file)
  })));

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "Analyze these uploaded images for BuyWise.",
                "Decide whether they show a real product/listing/checkout/purchase page for an item for sale.",
                "Reject unrelated images, non-products, unsafe/inappropriate products, illegal items, explicit content, weapons, drugs, or anything that should not appear in a buyer product feed.",
                "Extract only what is visible or strongly supported. Do not guess a missing price.",
                manualPrice ? `The user manually confirmed the price as ${formatCurrency(manualPrice)}. Treat that price as 100 confidence.` : "",
                notes ? `User notes: ${notes}` : ""
              ].filter(Boolean).join("\n")
            },
            ...imageContent
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "buywise_photo_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              isProductForSale: { type: "boolean" },
              isAppropriate: { type: "boolean" },
              imageType: {
                type: "string",
                enum: ["marketplace_listing", "retail_product_page", "checkout_page", "product_photo", "not_product"]
              },
              productName: { type: "string" },
              price: { type: ["number", "null"] },
              priceConfidence: { type: "number" },
              sourceLabel: { type: ["string", "null"] },
              condition: { type: ["string", "null"] },
              description: { type: "string" },
              sellerNotes: { type: ["string", "null"] },
              confidence: { type: "number" },
              warnings: {
                type: "array",
                items: { type: "string" }
              },
              extractedText: { type: "string" }
            },
            required: [
              "isProductForSale",
              "isAppropriate",
              "imageType",
              "productName",
              "price",
              "priceConfidence",
              "sourceLabel",
              "condition",
              "description",
              "sellerNotes",
              "confidence",
              "warnings",
              "extractedText"
            ]
          }
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI photo analysis failed with HTTP ${response.status}.`);
  }

  const data = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const text = data.output_text ?? data.output?.flatMap((item) => item.content ?? []).map((item) => item.text).find(Boolean);
  if (!text) {
    throw new Error("OpenAI did not return a structured photo analysis.");
  }

  const parsed = JSON.parse(text) as PhotoAnalysisExtract & { price: number | null; sourceLabel: string | null; condition: string | null; sellerNotes: string | null };
  return {
    ...parsed,
    productName: parsed.productName.trim(),
    price: typeof parsed.price === "number" ? parsed.price : undefined,
    sourceLabel: parsed.sourceLabel ?? undefined,
    condition: parsed.condition ?? undefined,
    sellerNotes: parsed.sellerNotes ?? undefined,
    priceConfidence: manualPrice ? 100 : Math.max(0, Math.min(100, Math.round(parsed.priceConfidence))),
    confidence: Math.max(0, Math.min(100, Math.round(parsed.confidence)))
  };
}

async function uploadPrivateFiles(files: File[], analysisId: string) {
  if (!supabaseAdmin) {
    return [];
  }

  const uploaded: string[] = [];
  for (const [index, file] of files.entries()) {
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${analysisId}/${index + 1}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: false
    });

    if (!error) {
      uploaded.push(path);
    }
  }

  return uploaded;
}

async function publishAnalysis({
  files,
  extract,
  result,
  price,
  marketPriceLabel
}: {
  files: File[];
  extract: PhotoAnalysisExtract;
  result: ReturnType<typeof calculateDealQuality>;
  price: number;
  marketPriceLabel?: string;
}) {
  if (!supabaseAdmin || !isSupabaseAdminConfigured()) {
    return undefined;
  }

  const analysisId = crypto.randomUUID();
  const safeToPublish =
    extract.isProductForSale &&
    extract.isAppropriate &&
    extract.productName.length > 0 &&
    extract.confidence >= 65;

  if (!safeToPublish) {
    return undefined;
  }

  const imagePaths = await uploadPrivateFiles(files, analysisId);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  if (imagePaths.length === 0) {
    return undefined;
  }

  const { data, error } = await supabaseAdmin
    .from("photo_analyses")
    .insert({
      id: analysisId,
      image_paths: imagePaths,
      product_name: extract.productName,
      price,
      source_label: extract.sourceLabel,
      condition: extract.condition,
      description: extract.description,
      extracted_text: extract.extractedText,
      deal_score: result.dealScore,
      recommendation: result.recommendation,
      confidence_score: result.confidenceScore,
      moderation_status: "approved",
      visible_in_search: true,
      market_price_label: marketPriceLabel,
      expires_at: expiresAt
    })
    .select("id, product_name, price, source_label, condition, deal_score, recommendation, created_at, expires_at, image_paths")
    .single();

  if (error || !data) {
    return undefined;
  }

  return {
    id: data.id,
    title: data.product_name,
    price: Number(data.price),
    sourceLabel: data.source_label ?? undefined,
    condition: data.condition ?? undefined,
    verdict: data.recommendation,
    dealScore: data.deal_score,
    createdAt: data.created_at,
    expiresAt: data.expires_at
  } satisfies PublicPhotoProduct;
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ ok: false, published: false, message: "Upload one or more product photos." }, 400);
  }

  const files = formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File)
    .slice(0, MAX_FILES);
  const notes = typeof formData.get("notes") === "string" ? String(formData.get("notes")) : "";
  const manualPrice = parseManualPrice(formData.get("manualPrice"));

  if (files.length === 0) {
    return json({ ok: false, published: false, message: "Upload at least one image." }, 400);
  }

  if (files.some((file) => !file.type.startsWith("image/") || file.size > MAX_FILE_BYTES)) {
    return json({ ok: false, published: false, message: "Use image files under 8MB each." }, 400);
  }

  let extract: PhotoAnalysisExtract;
  try {
    extract = await analyzeWithOpenAI(files, notes, manualPrice);
  } catch (error) {
    return json(
      {
        ok: false,
        published: false,
        message: error instanceof Error ? error.message : "Photo analysis failed."
      },
      500
    );
  }

  if (!extract.isProductForSale || extract.imageType === "not_product") {
    return json({
      ok: false,
      published: false,
      extract,
      message: "This does not look like a product for sale. Upload a marketplace listing, retail product page, checkout screen, or product sale photo."
    });
  }

  if (!extract.isAppropriate) {
    return json({
      ok: false,
      published: false,
      extract,
      message: "This product cannot be added to BuyWise."
    });
  }

  const finalPrice = manualPrice ?? extract.price;
  if (!finalPrice) {
    return json({
      ok: false,
      published: false,
      extract,
      message: "BuyWise needs the price before it can score this photo. Enter the price and try again."
    });
  }

  const comps = await getMarketComps(extract.productName);
  const marketBenchmarkAvailable = typeof comps.fairPrice === "number" && comps.confidence >= 55;
  const dealContext: DealContext =
    extract.imageType === "retail_product_page" || extract.imageType === "checkout_page" ? "retail" : "resale";
  const marketplace = marketplaceFromSource(extract.sourceLabel);
  const listingText = [extract.description, extract.sellerNotes, notes, extract.extractedText].filter(Boolean).join(" ");
  const condition = [extract.condition ?? "Good", extract.description].join(" ");
  const priceConfidence = manualPrice ? 100 : extract.priceConfidence;

  const result = calculateDealQuality({
    askingPrice: finalPrice,
    productName: extract.productName,
    fairPrice: comps.fairPrice,
    usedLow: comps.low,
    usedHigh: comps.high,
    condition,
    marketplace,
    listingText,
    analysisMode: dealContext,
    marketBenchmarkAvailable,
    extractionConfidence: extract.confidence,
    priceConfidence,
    marketPriceConfidence: comps.confidence
  });

  const resaleAlternatives = comps.comps
    .filter((comp) => comp.source === "eBay")
    .slice(0, 2)
    .map((comp) => ({
      productId: comp.id,
      title: comp.title,
      price: comp.price,
      priceLabel: comp.source,
      sourceType: "resale" as const,
      actionLabel: "Compare resale price",
      outcome: comp.url ?? "",
      reason: "Comparable product found from configured market providers."
    }));

  const retailAlternatives = comps.comps
    .filter((comp) => comp.source !== "eBay")
    .slice(0, 2)
    .map((comp) => ({
      productId: comp.id,
      title: comp.title,
      price: comp.price,
      priceLabel: comp.source,
      sourceType: "retail" as const,
      actionLabel: "Compare retail price",
      outcome: comp.url ?? "",
      reason: "Comparable product found from configured market providers."
    }));

  const marketPriceLabel = marketBenchmarkAvailable ? `verified market range near ${formatCurrency(comps.fairPrice ?? finalPrice)}` : undefined;
  const context: ListingAnalysisContext = {
    sourceLabel: extract.sourceLabel ?? "Photo upload",
    marketplace,
    askingPrice: finalPrice,
    marketPriceLabel,
    matchedProductName: extract.productName,
    priceConfidence,
    priceSource: manualPrice ? "Price confirmed by you" : "Price read from uploaded photos",
    priceExplanation: manualPrice ? "Price confirmed by you." : "Price extracted from the uploaded photos.",
    extractionConfidence: extract.confidence,
    dataSources: [],
    resaleAlternatives,
    retailAlternatives
  };

  const feedItem = await publishAnalysis({
    files,
    extract,
    result,
    price: finalPrice,
    marketPriceLabel
  });

  return json({
    ok: true,
    published: Boolean(feedItem),
    message: feedItem
      ? "Photo analyzed and added to Search for 24 hours."
      : "Photo analyzed. It was not published to Search because storage is not configured or confidence was too low.",
    extract,
    result,
    context,
    feedItem
  });
}
