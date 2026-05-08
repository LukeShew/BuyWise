import type { MarketplaceListing, Product } from "@/types";

export async function getCraigslistLocalListings(product: Product): Promise<MarketplaceListing[]> {
  return [
    {
      title: `${product.brand} ${product.model} local pickup`,
      price: Math.round(product.fairPrice * 1.05),
      condition: "Good",
      location: "Brooklyn, NY",
      source: "Craigslist",
      dateListed: "2026-05-01",
      url: "https://example.com/craigslist-local-listing"
    },
    {
      title: `${product.model} priced to sell`,
      price: Math.round(product.fairPrice * 0.88),
      condition: "Fair",
      location: "Queens, NY",
      source: "Craigslist",
      dateListed: "2026-05-03",
      url: "https://example.com/craigslist-local-deal"
    }
  ];
}
