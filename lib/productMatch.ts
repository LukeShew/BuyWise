import { mockProducts } from "@/data/mockProducts";
import type { Product, ProductMatchCandidate } from "@/types";
import { clamp } from "@/lib/format";

const weakTokens = new Set([
  "apple",
  "macbook",
  "laptop",
  "computer",
  "camera",
  "bike",
  "monitor",
  "sony",
  "canon",
  "dell",
  "lenovo",
  "microsoft",
  "trek",
  "specialized",
  "giant",
  "samsung",
  "asus",
  "benq",
  "lg",
  "new",
  "used",
  "refurbished",
  "sale",
  "deal",
  "inch",
  "inches"
]);

const strongShortTokens = new Set(["m1", "m2", "r5", "g5", "x1", "xps", "fx"]);

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokens(value: string) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length >= 2);
}

function productName(product: Product) {
  return `${product.brand} ${product.model}`;
}

function productTitle(product: Product) {
  return `${productName(product)} (${product.year})`;
}

function hasStrongToken(token: string) {
  return token.length >= 4 || strongShortTokens.has(token);
}

function isAmbiguousAppleLaptop(inputTokens: string[]) {
  return (
    inputTokens.includes("apple") &&
    inputTokens.includes("macbook") &&
    !inputTokens.some((token) => ["air", "pro", "m1", "m2", "m3", "m4"].includes(token))
  );
}

export function getProductName(product: Product) {
  return productName(product);
}

export function findProductMatch(input: string): {
  product: Product | null;
  confidence: number;
  explanation: string;
  candidates: ProductMatchCandidate[];
} {
  const normalizedInput = normalize(input);
  const inputTokens = tokens(input);

  if (!normalizedInput) {
    return {
      product: null,
      confidence: 0,
      explanation: "No product text was available to match against BuyWise benchmarks.",
      candidates: []
    };
  }

  const scored = mockProducts
    .map((product) => {
      const fullName = normalize(productName(product));
      const model = normalize(product.model);
      const brand = normalize(product.brand);
      const modelTokens = tokens(product.model);
      const matchedModelTokens = modelTokens.filter((token) => normalizedInput.includes(token));
      const strongMatches = matchedModelTokens.filter(hasStrongToken);
      const modelCoverage = matchedModelTokens.length / Math.max(modelTokens.length, 1);
      let score = 0;
      const reasons: string[] = [];

      if (normalizedInput.includes(fullName)) {
        score += 96;
        reasons.push("full product name found");
      } else if (normalizedInput.includes(model)) {
        score += 84;
        reasons.push("model name found");
      } else {
        if (normalizedInput.includes(brand) && matchedModelTokens.length > 0) {
          score += 16;
          reasons.push("brand plus model detail found");
        }

        if (matchedModelTokens.length > 0) {
          score += modelCoverage * 46;
          reasons.push(`${matchedModelTokens.length} model detail${matchedModelTokens.length === 1 ? "" : "s"} matched`);
        }

        score += strongMatches.length * 14;
      }

      if (normalizedInput.includes(String(product.year))) {
        score += 8;
        reasons.push("year matched");
      }

      if (normalizedInput.includes(brand) && score >= 45) {
        score += 8;
      }

      const hasSpecificEvidence =
        normalizedInput.includes(fullName) ||
        normalizedInput.includes(model) ||
        strongMatches.length > 0 ||
        matchedModelTokens.some((token) => !weakTokens.has(token) && token.length >= 3);

      if (!hasSpecificEvidence) {
        score = Math.min(score, 48);
      }

      if (isAmbiguousAppleLaptop(inputTokens) && product.category === "Laptops") {
        score = Math.min(score, 52);
        reasons.push("Apple laptop generation is unclear");
      }

      const confidence = Math.round(clamp(score, 0, 98));

      return {
        product,
        confidence,
        reason: reasons.length > 0 ? reasons.join(", ") : "weak text similarity"
      };
    })
    .filter((item) => item.confidence >= 25)
    .sort((a, b) => b.confidence - a.confidence);

  const candidates = scored.slice(0, 4).map<ProductMatchCandidate>((item) => ({
    productId: item.product.id,
    title: productTitle(item.product),
    confidence: item.confidence,
    reason: item.reason
  }));

  const best = scored[0];
  if (!best || best.confidence < 70) {
    return {
      product: null,
      confidence: best?.confidence ?? 0,
      explanation: best
        ? "BuyWise found a possible match, but the product generation or model details are not clear enough to score automatically."
        : "No reliable matching BuyWise benchmark was found for this link.",
      candidates
    };
  }

  return {
    product: best.product,
    confidence: best.confidence,
    explanation: `Matched to ${productTitle(best.product)} because ${best.reason}.`,
    candidates
  };
}

export function findBestProductMatch(input: string) {
  return findProductMatch(input).product;
}
