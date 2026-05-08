import type { LinkAnalysisMode, MarketplaceSource } from "@/types";

export const LISTING_DRAFT_STORAGE_KEY = "buywise.listingDraft.v1";

export interface ListingDraft {
  listingUrl?: string;
  analysisMode?: LinkAnalysisMode;
  productName?: string;
  askingPrice?: string;
  marketplace?: MarketplaceSource;
  description?: string;
}
