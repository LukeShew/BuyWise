export type RecommendationLabel =
  | "Great deal"
  | "Fair price"
  | "Overpriced"
  | "Risky purchase"
  | "Avoid";

export type RiskLevel = "Low" | "Medium" | "High";

export type SavedItemStatus =
  | "watching"
  | "contacted"
  | "negotiating"
  | "bought"
  | "passed";

export type MarketplaceSource =
  | "eBay"
  | "Craigslist"
  | "Facebook Marketplace"
  | "OfferUp"
  | "Local seller"
  | "Other";

export type DealContext = "resale" | "retail";

export type PhotoModerationStatus = "approved" | "rejected" | "needs_review";

export type PhotoImageType =
  | "marketplace_listing"
  | "retail_product_page"
  | "checkout_page"
  | "product_photo"
  | "not_product";

export type Severity = "low" | "medium" | "high";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type ScoreTone = "positive" | "negative" | "neutral";

export interface DealQualityInput {
  askingPrice: number;
  productName?: string;
  fairPrice?: number;
  usedLow?: number;
  usedHigh?: number;
  reliabilityScore?: number;
  scamRiskScore?: number;
  condition: string;
  marketplace?: MarketplaceSource;
  listingText?: string;
  analysisMode?: DealContext;
  marketBenchmarkAvailable?: boolean;
  extractionConfidence?: number;
  priceConfidence?: number;
  marketPriceConfidence?: number;
  listingCompletenessScore?: number;
  sourceReliabilityScore?: number;
  warrantyProtectionScore?: number;
}

export interface RiskSignal {
  label: string;
  detail: string;
  severity: Severity;
}

export interface ScoreBreakdownItem {
  label: string;
  impact: string;
  detail: string;
  tone: ScoreTone;
}

export interface DealQualityResult {
  dealScore: number;
  recommendation: RecommendationLabel;
  explanation: string;
  suggestedOfferLow: number;
  suggestedOfferHigh: number;
  riskLevel: RiskLevel;
  priceDifference: number;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  confidenceReasons: string[];
  marketPositionLabel: string;
  priceAttractivenessScore: number;
  trustSafetyScore: number;
  conditionScore: number;
  marketCompetitivenessScore: number;
  scoreBreakdown: ScoreBreakdownItem[];
  pros: string[];
  cons: string[];
  dataSources: string[];
  redFlags: RiskSignal[];
  positiveSignals: string[];
  negotiationTip: string;
  nextSteps: string[];
}

export interface ListingAlternative {
  productId: string;
  title: string;
  price: number;
  priceLabel: string;
  sourceType: DealContext;
  actionLabel: string;
  outcome: string;
  reason: string;
}

export interface PhotoAnalysisExtract {
  isProductForSale: boolean;
  isAppropriate: boolean;
  imageType: PhotoImageType;
  productName: string;
  price?: number;
  priceConfidence: number;
  sourceLabel?: string;
  condition?: string;
  description: string;
  sellerNotes?: string;
  confidence: number;
  warnings: string[];
  extractedText: string;
}

export interface PublicPhotoProduct {
  id: string;
  title: string;
  price?: number;
  sourceLabel?: string;
  condition?: string;
  verdict: RecommendationLabel;
  dealScore: number;
  imageUrl?: string;
  createdAt: string;
  expiresAt: string;
}

export interface ListingAnalysisContext {
  sourceLabel: string;
  marketplace: MarketplaceSource;
  sellerLocation?: string;
  askingPrice: number;
  marketPriceLabel?: string;
  matchedProductName: string;
  priceConfidence?: number;
  priceSource?: string;
  priceExplanation?: string;
  extractionConfidence?: number;
  dataSources: string[];
  resaleAlternatives: ListingAlternative[];
  retailAlternatives: ListingAlternative[];
}

export interface PhotoAnalysisApiResponse {
  ok: boolean;
  published: boolean;
  message: string;
  extract?: PhotoAnalysisExtract;
  result?: DealQualityResult;
  context?: ListingAnalysisContext;
  feedItem?: PublicPhotoProduct;
}

export interface SavedItem {
  id: string;
  userId?: string;
  productId: string;
  askingPrice: number;
  marketplace: MarketplaceSource;
  sellerLocation: string;
  notes: string;
  status: SavedItemStatus;
  createdAt: string;
}

export interface ListingCheck {
  id: string;
  userId?: string;
  productId: string;
  askingPrice: number;
  condition: string;
  description: string;
  marketplace: MarketplaceSource;
  dealScore: number;
  riskLevel: RiskLevel;
  suggestedOfferLow: number;
  suggestedOfferHigh: number;
  createdAt: string;
}
