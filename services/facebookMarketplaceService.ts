import type { MarketplaceListing, Product } from "@/types";

export async function getFacebookMarketplaceListings(product: Product): Promise<MarketplaceListing[]> {
  return [
    {
      title: `${product.brand} ${product.model} must go today`,
      price: Math.round(product.fairPrice * 0.78),
      condition: "Unknown",
      location: "Local area",
      source: "Facebook Marketplace",
      dateListed: "2026-05-04",
      url: "https://example.com/facebook-marketplace-placeholder"
    },
    {
      title: `${product.brand} ${product.model} excellent condition`,
      price: Math.round(product.fairPrice * 1.12),
      condition: "Excellent",
      location: "Local area",
      source: "Facebook Marketplace",
      dateListed: "2026-05-05",
      url: "https://example.com/facebook-marketplace-placeholder-2"
    }
  ];
}
