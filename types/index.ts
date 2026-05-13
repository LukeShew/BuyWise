export type ProductCategory = "Cameras" | "Laptops" | "Bikes" | "Monitors";

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

export type LinkAnalysisMode = "resale" | "retail";

export type OfferSourceMethod =
  | "official_api"
  | "affiliate_api"
  | "metadata"
  | "html"
  | "headless"
  | "manual";

export type OfferProviderStatusType = "configured" | "missing_config" | "error" | "skipped";

export type Severity = "low" | "medium" | "high";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type ScoreTone = "positive" | "negative" | "neutral";

export interface ProductIssue {
  issue: string;
  severity: Severity;
}

export interface Product {
  id: string;
  category: ProductCategory;
  brand: string;
  model: string;
  year: number;
  msrp: number;
  usedLow: number;
  usedAvg: number;
  usedHigh: number;
  fairPrice: number;
  depreciationPercent: number;
  reliabilityScore: number;
  demandScore: number;
  scamRiskScore: number;
  commonIssues: ProductIssue[];
  bestYearsModels: string[];
  modelsToAvoid: string[];
  buyingChecklist: string[];
  sellerQuestions: string[];
  recommendation: RecommendationLabel;
  recommendationExplanation: string;
}

export interface MarketplaceListing {
  title: string;
  price: number;
  condition: string;
  location: string;
  source: MarketplaceSource;
  dateListed: string;
  url: string;
}

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
  analysisMode?: LinkAnalysisMode;
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

export interface ProductMatchCandidate {
  productId: string;
  title: string;
  confidence: number;
  reason: string;
}

export interface ListingAlternative {
  productId: string;
  title: string;
  price: number;
  priceLabel: string;
  sourceType: LinkAnalysisMode;
  actionLabel: string;
  outcome: string;
  reason: string;
}

export interface OfferProviderStatus {
  provider: string;
  label: string;
  status: OfferProviderStatusType;
  message: string;
}

export interface LiveOffer {
  id: string;
  title: string;
  url: string;
  canonicalUrl?: string;
  sourceLabel: string;
  sourceDomain?: string;
  sourceType: LinkAnalysisMode;
  sourceMethod: OfferSourceMethod;
  price?: number;
  currency?: string;
  condition?: string;
  imageUrl?: string;
  merchantName?: string;
  availability?: string;
  confidence: number;
  priceConfidence?: number;
  explanation: string;
  warnings: string[];
  fetchedAt: string;
}

export interface LiveOfferSearchResponse {
  ok: boolean;
  query: string;
  offers: LiveOffer[];
  providerStatuses: OfferProviderStatus[];
  message: string;
}

export interface ListingAnalysisContext {
  mode: LinkAnalysisMode;
  listingUrl?: string;
  sourceLabel: string;
  sourceDomain?: string;
  marketplace: MarketplaceSource;
  sellerLocation?: string;
  askingPrice: number;
  marketPriceLabel?: string;
  matchedProductName: string;
  priceConfidence?: number;
  priceSource?: string;
  priceExplanation?: string;
  extractionConfidence?: number;
  matchCandidates?: ProductMatchCandidate[];
  dataSources: string[];
  resaleAlternatives: ListingAlternative[];
  retailAlternatives: ListingAlternative[];
}

export interface LinkExtractionResult {
  ok: boolean;
  manualRequired?: boolean;
  url: string;
  sourceLabel: string;
  sourceDomain?: string;
  mode?: LinkAnalysisMode;
  marketplace?: MarketplaceSource;
  title?: string;
  description?: string;
  price?: number;
  priceConfidence?: number;
  priceSource?: string;
  priceExplanation?: string;
  productName?: string;
  matchCandidates?: ProductMatchCandidate[];
  liveOffer?: LiveOffer;
  providerStatuses?: OfferProviderStatus[];
  confidence: number;
  message: string;
  warnings?: string[];
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
