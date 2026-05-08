import type { MarketplaceListing, Product } from "@/types";

export async function getEbayCompletedListings(product: Product): Promise<MarketplaceListing[]> {
  return [
    {
      title: `${product.brand} ${product.model} clean used listing`,
      price: Math.round(product.fairPrice * 0.96),
      condition: "Good",
      location: "Completed online sale",
      source: "eBay",
      dateListed: "2026-04-18",
      url: "https://example.com/ebay-completed-sale"
    },
    {
      title: `${product.brand} ${product.model} with accessories`,
      price: Math.round(product.usedHigh * 0.94),
      condition: "Very good",
      location: "Completed online sale",
      source: "eBay",
      dateListed: "2026-04-22",
      url: "https://example.com/ebay-completed-sale-accessories"
    },
    {
      title: `${product.brand} ${product.model} budget condition`,
      price: Math.round(product.usedLow * 1.03),
      condition: "Fair",
      location: "Completed online sale",
      source: "eBay",
      dateListed: "2026-04-29",
      url: "https://example.com/ebay-completed-sale-budget"
    }
  ];
}
