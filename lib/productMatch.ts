import { mockProducts } from "@/data/mockProducts";
import type { Product } from "@/types";

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

export function getProductName(product: Product) {
  return productName(product);
}

export function findBestProductMatch(input: string) {
  const normalizedInput = normalize(input);
  if (!normalizedInput) {
    return null;
  }

  let bestMatch: { product: Product; score: number } | null = null;

  for (const product of mockProducts) {
    const fullName = normalize(productName(product));
    const model = normalize(product.model);
    const brand = normalize(product.brand);
    const modelTokens = tokens(product.model);
    let score = 0;

    if (normalizedInput.includes(fullName)) {
      score += 100;
    }

    if (normalizedInput.includes(model)) {
      score += 75;
    }

    if (normalizedInput.includes(brand)) {
      score += 25;
    }

    for (const token of modelTokens) {
      if (normalizedInput.includes(token)) {
        score += token.length <= 2 ? 8 : 14;
      }
    }

    if (normalizedInput.includes(String(product.year))) {
      score += 8;
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { product, score };
    }
  }

  return bestMatch && bestMatch.score >= 38 ? bestMatch.product : null;
}
