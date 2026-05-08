import type {
  DealQualityInput,
  DealQualityResult,
  MarketplaceSource,
  RecommendationLabel,
  RiskLevel,
  RiskSignal
} from "@/types";
import { clamp, formatCurrency } from "@/lib/format";

const poorConditionTerms = [
  "poor",
  "for parts",
  "broken",
  "repair",
  "damaged",
  "cracked",
  "activation lock",
  "icloud",
  "locked",
  "mdm",
  "stolen"
];
const goodConditionTerms = ["excellent", "mint", "like new", "open box", "new"];

const redFlagRules: Array<{
  label: string;
  detail: string;
  severity: RiskSignal["severity"];
  terms: string[];
}> = [
  {
    label: "Payment before pickup",
    detail: "The seller appears to want money before you inspect the item.",
    severity: "high",
    terms: [
      "pay before",
      "payment before",
      "deposit",
      "zelle first",
      "zelle deposit",
      "cashapp first",
      "cash app first",
      "venmo first",
      "venmo deposit",
      "wire",
      "western union"
    ]
  },
  {
    label: "Urgency pressure",
    detail: "Pressure language can be used to rush buyers past basic checks.",
    severity: "medium",
    terms: ["must go today", "need gone today", "first come first serve", "no holds", "moving today", "urgent", "priced to sell today"]
  },
  {
    label: "Stock photos only",
    detail: "A real seller should be able to send current photos or a working video.",
    severity: "high",
    terms: ["stock photo", "stock photos", "photos from website", "google image", "not actual photo"]
  },
  {
    label: "No proof of ownership",
    detail: "Missing receipts or serial details increase stolen-item and lock risk.",
    severity: "high",
    terms: ["no receipt", "lost receipt", "no serial", "serial removed", "can't provide serial", "dont have serial"]
  },
  {
    label: "Refuses safe meetup",
    detail: "Avoid sellers who will not meet publicly or let you inspect the item.",
    severity: "high",
    terms: ["ship only", "no meetup", "can't meet", "will not meet", "payment only", "delivery only"]
  },
  {
    label: "Lock or ownership warning",
    detail: "Locked electronics can be useless even if the price is low.",
    severity: "high",
    terms: ["icloud locked", "activation lock", "mdm", "bios password", "managed device", "locked account"]
  },
  {
    label: "Broken or parts listing",
    detail: "Repair listings need a much lower offer and should not be treated like normal used items.",
    severity: "high",
    terms: ["for parts", "as-is", "as is", "broken", "does not turn on", "cracked", "water damage"]
  }
];

const positiveSignalRules: Array<{ label: string; terms: string[] }> = [
  {
    label: "Receipt or proof of purchase",
    terms: ["receipt", "original receipt", "receipt included", "proof of purchase"]
  },
  {
    label: "Serial number available",
    terms: ["serial number", "serial available"]
  },
  {
    label: "Original box included",
    terms: ["original box"]
  },
  {
    label: "Working video available",
    terms: ["video available", "working video", "video of it working", "can send video"]
  },
  {
    label: "Can test before buying",
    terms: ["can test", "test before buying"]
  },
  {
    label: "Public meetup",
    terms: ["public meetup", "meet in public", "meet at police station", "meet at library", "local pickup"]
  },
  {
    label: "Warranty mentioned",
    terms: ["warranty"]
  },
  {
    label: "Battery health listed",
    terms: ["battery health"]
  },
  {
    label: "Shutter count listed",
    terms: ["shutter count"]
  }
];

function getMarketplaceRiskAdjustment(marketplace?: MarketplaceSource) {
  const adjustments: Record<MarketplaceSource, number> = {
    eBay: -1,
    Craigslist: 1,
    "Facebook Marketplace": 2,
    OfferUp: 2,
    "Local seller": 1,
    Other: 1
  };

  return marketplace ? adjustments[marketplace] : 0;
}

function detectRedFlags(input: DealQualityInput): RiskSignal[] {
  const normalized = [input.condition, input.listingText ?? ""].join(" ").toLowerCase();
  const flags = redFlagRules
    .filter((rule) => rule.terms.some((term) => normalized.includes(term)))
    .map((rule) => ({
      label: rule.label,
      detail: rule.detail,
      severity: rule.severity
    }));

  if (input.askingPrice <= input.fairPrice * 0.65) {
    flags.push({
      label: "Price far below market",
      detail: "This is cheap enough that condition, ownership, or scam probability needs extra proof.",
      severity: "high"
    });
  }

  return flags;
}

function detectPositiveSignals(input: DealQualityInput) {
  const normalized = [input.condition, input.listingText ?? ""].join(" ").toLowerCase();
  return positiveSignalRules
    .filter((rule) => rule.terms.some((term) => normalized.includes(term)))
    .map((rule) => rule.label);
}

function getConditionAdjustment(condition: string) {
  const normalized = condition.toLowerCase();

  if (poorConditionTerms.some((term) => normalized.includes(term))) {
    return -14;
  }

  if (normalized.includes("fair")) {
    return -7;
  }

  if (goodConditionTerms.some((term) => normalized.includes(term))) {
    return 6;
  }

  return 0;
}

function getRiskLevel(
  scamRiskScore: number,
  reliabilityScore: number,
  condition: string,
  redFlags: RiskSignal[]
): RiskLevel {
  const conditionRisk = poorConditionTerms.some((term) => condition.toLowerCase().includes(term));
  const hasHighRiskFlag = redFlags.some((flag) => flag.severity === "high");

  if (scamRiskScore >= 8 || reliabilityScore <= 4 || conditionRisk || hasHighRiskFlag) {
    return "High";
  }

  if (scamRiskScore >= 5 || reliabilityScore <= 6 || redFlags.length > 0) {
    return "Medium";
  }

  return "Low";
}

function getRecommendationLabel(input: DealQualityInput, effectiveScamRiskScore: number, redFlags: RiskSignal[]): RecommendationLabel {
  const priceRatio = input.askingPrice / input.fairPrice;
  const highRisk = effectiveScamRiskScore >= 8 || redFlags.some((flag) => flag.severity === "high");
  const lowReliability = input.reliabilityScore <= 4;
  const priceIsHigh = input.askingPrice >= input.fairPrice * 1.1;

  if (lowReliability && priceIsHigh) {
    return "Avoid";
  }

  if (highRisk) {
    return "Risky purchase";
  }

  if (priceRatio <= 0.8 && effectiveScamRiskScore <= 4) {
    return "Great deal";
  }

  if (priceRatio >= 1.15) {
    return "Overpriced";
  }

  if (priceRatio >= 0.9 && priceRatio <= 1.1) {
    return "Fair price";
  }

  if (effectiveScamRiskScore >= 6 && priceRatio < 0.85) {
    return "Risky purchase";
  }

  return priceRatio < 0.9 ? "Great deal" : "Fair price";
}

function buildExplanation(input: DealQualityInput, recommendation: RecommendationLabel, redFlags: RiskSignal[]) {
  const difference = Math.round(Math.abs(input.askingPrice - input.fairPrice));

  if (redFlags.some((flag) => flag.severity === "high")) {
    return "This listing has serious risk signals. Do not pay before inspection, and get proof of ownership and condition before meeting.";
  }

  if (recommendation === "Great deal") {
    return `This is about ${formatCurrency(difference)} under fair value. The price is strong, but still verify the seller, condition, and proof before moving fast.`;
  }

  if (recommendation === "Fair price") {
    return "This is close to estimated fair value. It is worth considering if the condition checks out and the seller can prove it works.";
  }

  if (recommendation === "Overpriced") {
    return `This appears overpriced by about ${formatCurrency(difference)}. Negotiate hard or wait for a cleaner listing.`;
  }

  if (recommendation === "Risky purchase") {
    return "The pricing may look tempting, but the risk signals are high. Ask for proof, serial numbers, and a working video before meeting.";
  }

  return "The reliability and price combination is weak. Passing is the smarter move unless the seller proves everything and drops the price heavily.";
}

function getConfidenceScore(input: DealQualityInput, redFlags: RiskSignal[], positiveSignals: string[]) {
  const textLength = input.listingText?.trim().length ?? 0;
  const textScore = textLength > 250 ? 16 : textLength > 80 ? 10 : textLength > 0 ? 5 : -8;
  const priceScore = input.askingPrice >= input.usedLow && input.askingPrice <= input.usedHigh ? 10 : 2;
  const proofScore = clamp(positiveSignals.length * 4, 0, 14);
  const riskPenalty = redFlags.reduce((sum, flag) => sum + (flag.severity === "high" ? 8 : flag.severity === "medium" ? 5 : 2), 0);

  return Math.round(clamp(62 + textScore + priceScore + proofScore - riskPenalty, 30, 96));
}

function getNegotiationTip(input: DealQualityInput, riskLevel: RiskLevel) {
  const priceDifference = input.askingPrice - input.fairPrice;

  if (riskLevel === "High") {
    return "Do not negotiate until the seller proves ownership and shows the item working.";
  }

  if (priceDifference >= input.fairPrice * 0.15) {
    return "Open below fair value and mention recent sold prices, not asking prices.";
  }

  if (priceDifference <= input.fairPrice * -0.15) {
    return "The price is already low. Ask verification questions first, then move quickly if it checks out.";
  }

  return "Offer slightly under fair value and leave room to meet in the middle.";
}

function getNextSteps(input: DealQualityInput, riskLevel: RiskLevel, redFlags: RiskSignal[]) {
  if (riskLevel === "High") {
    return [
      "Ask for a fresh working video with today's date or your name in the shot.",
      "Get proof of ownership, receipt, or serial number before meeting.",
      "Meet publicly and do not send payment before inspection."
    ];
  }

  if (redFlags.length > 0) {
    return [
      "Clarify every red flag before making an offer.",
      "Ask category-specific inspection questions.",
      "Use the suggested offer range only after the seller answers clearly."
    ];
  }

  if (input.askingPrice > input.fairPrice) {
    return [
      "Send a fair offer with one sentence explaining the market range.",
      "Ask for proof of condition before driving there.",
      "Be ready to pass if the seller will not move on price."
    ];
  }

  return [
    "Ask for proof it works and verify ownership.",
    "Schedule a public meetup where you can inspect it.",
    "Use the checklist before handing over payment."
  ];
}

export function calculateDealQuality(input: DealQualityInput): DealQualityResult {
  const redFlags = detectRedFlags(input);
  const positiveSignals = detectPositiveSignals(input);
  const effectiveScamRiskScore = clamp(
    input.scamRiskScore +
      getMarketplaceRiskAdjustment(input.marketplace) +
      redFlags.reduce((sum, flag) => sum + (flag.severity === "high" ? 2 : flag.severity === "medium" ? 1 : 0), 0) -
      Math.min(2, positiveSignals.length),
    1,
    10
  );
  const conditionAdjustment = getConditionAdjustment(input.condition);
  const priceRatio = input.askingPrice / input.fairPrice;
  const reliabilityAdjustment = (input.reliabilityScore - 7) * 3;
  const scamAdjustment = (effectiveScamRiskScore - 4) * -5;
  const redFlagAdjustment = redFlags.reduce(
    (sum, flag) => sum + (flag.severity === "high" ? -10 : flag.severity === "medium" ? -6 : -3),
    0
  );
  const positiveSignalAdjustment = clamp(positiveSignals.length * 2, 0, 8);
  const priceScore = clamp(100 - Math.max(0, priceRatio - 0.75) * 120, 15, 100);
  const dealScore = Math.round(
    clamp(
      priceScore +
        reliabilityAdjustment +
        scamAdjustment +
        conditionAdjustment +
        redFlagAdjustment +
        positiveSignalAdjustment,
      0,
      100
    )
  );

  const recommendation = getRecommendationLabel(input, effectiveScamRiskScore, redFlags);
  const riskLevel = getRiskLevel(effectiveScamRiskScore, input.reliabilityScore, input.condition, redFlags);

  const poorCondition = poorConditionTerms.some((term) => input.condition.toLowerCase().includes(term));
  const baseLow = poorCondition ? input.fairPrice * 0.72 : input.fairPrice * 0.85;
  const baseHigh = poorCondition ? input.fairPrice * 0.82 : input.fairPrice * 0.95;

  const suggestedOfferLow =
    input.askingPrice < input.fairPrice
      ? Math.max(input.usedLow, input.askingPrice * 0.92)
      : Math.max(input.usedLow, baseLow);
  const suggestedOfferHigh =
    input.askingPrice < input.fairPrice
      ? Math.min(input.fairPrice, input.askingPrice * 0.98)
      : Math.min(input.usedHigh, baseHigh);

  return {
    dealScore,
    recommendation,
    explanation: buildExplanation(input, recommendation, redFlags),
    suggestedOfferLow: Math.round(suggestedOfferLow),
    suggestedOfferHigh: Math.round(Math.max(suggestedOfferHigh, suggestedOfferLow)),
    riskLevel,
    priceDifference: Math.round(input.askingPrice - input.fairPrice),
    confidenceScore: getConfidenceScore(input, redFlags, positiveSignals),
    redFlags,
    positiveSignals,
    negotiationTip: getNegotiationTip(input, riskLevel),
    nextSteps: getNextSteps(input, riskLevel, redFlags)
  };
}
