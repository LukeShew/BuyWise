import { getCraigslistLocalListings } from "@/services/craigslistService";
import { getEbayCompletedListings } from "@/services/ebayService";
import { getFacebookMarketplaceListings } from "@/services/facebookMarketplaceService";
import type { MarketplaceListing, Product } from "@/types";

export async function getMarketplaceSignals(product: Product): Promise<MarketplaceListing[]> {
  const [ebay, craigslist, facebook] = await Promise.all([
    getEbayCompletedListings(product),
    getCraigslistLocalListings(product),
    getFacebookMarketplaceListings(product)
  ]);

  return [...ebay, ...craigslist, ...facebook].sort((a, b) => a.price - b.price);
}

export function summarizeMarketListings(listings: MarketplaceListing[]) {
  if (listings.length === 0) {
    return {
      low: 0,
      average: 0,
      high: 0
    };
  }

  const prices = listings.map((listing) => listing.price);
  const total = prices.reduce((sum, price) => sum + price, 0);

  return {
    low: Math.min(...prices),
    average: Math.round(total / prices.length),
    high: Math.max(...prices)
  };
}
