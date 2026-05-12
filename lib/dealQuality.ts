import type {
  ConfidenceLevel,
  DealQualityInput,
  DealQualityResult,
  MarketplaceSource,
  RecommendationLabel,
  RiskLevel,
  ScoreBreakdownItem,
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

function getListingCompletenessScore(input: DealQualityInput) {
  if (typeof input.listingCompletenessScore === "number") {
    return clamp(input.listingCompletenessScore, 0, 100);
  }

  const textLength = input.listingText?.trim().length ?? 0;
  const detailScore = textLength > 350 ? 84 : textLength > 160 ? 70 : textLength > 60 ? 55 : textLength > 0 ? 42 : 28;
  return clamp(detailScore + (input.condition ? 8 : 0), 0, 100);
}

function getSourceReliabilityScore(input: DealQualityInput) {
  if (typeof input.sourceReliabilityScore === "number") {
    return clamp(input.sourceReliabilityScore, 0, 100);
  }

  if (input.analysisMode === "retail") {
    return 82;
  }

  const scores: Record<MarketplaceSource, number> = {
    eBay: 72,
    Craigslist: 44,
    "Facebook Marketplace": 42,
    OfferUp: 46,
    "Local seller": 45,
    Other: 54
  };

  return input.marketplace ? scores[input.marketplace] : 54;
}

function getWarrantyProtectionScore(input: DealQualityInput, positiveSignals: string[]) {
  if (typeof input.warrantyProtectionScore === "number") {
    return clamp(input.warrantyProtectionScore, 0, 100);
  }

  const proofSignals = positiveSignals.filter((signal) =>
    /receipt|serial|video|test|public|warranty|battery|shutter/i.test(signal)
  ).length;
  const retailBase = input.analysisMode === "retail" ? 68 : 35;
  return clamp(retailBase + proofSignals * 12, 0, 96);
}

function getPriceAttractivenessScore(input: DealQualityInput, effectiveScamRiskScore: number) {
  const ratio = input.askingPrice / input.fairPrice;
  let score = 70;

  if (ratio <= 0.45) {
    score = 54;
  } else if (ratio <= 0.62) {
    score = 68;
  } else if (ratio <= 0.8) {
    score = 84;
  } else if (ratio <= 0.95) {
    score = 78;
  } else if (ratio <= 1.05) {
    score = 70;
  } else if (ratio <= 1.15) {
    score = 58;
  } else if (ratio <= 1.3) {
    score = 42;
  } else {
    score = 25;
  }

  if (ratio <= 0.62 && effectiveScamRiskScore >= 6) {
    score -= 12;
  }

  return Math.round(clamp(score, 0, 100));
}

function getTrustSafetyScore({
  input,
  redFlags,
  positiveSignals,
  effectiveScamRiskScore,
  sourceReliabilityScore,
  warrantyProtectionScore
}: {
  input: DealQualityInput;
  redFlags: RiskSignal[];
  positiveSignals: string[];
  effectiveScamRiskScore: number;
  sourceReliabilityScore: number;
  warrantyProtectionScore: number;
}) {
  const redFlagPenalty = redFlags.reduce(
    (sum, flag) => sum + (flag.severity === "high" ? 18 : flag.severity === "medium" ? 10 : 5),
    0
  );
  const missingProofPenalty = positiveSignals.length === 0 && input.analysisMode !== "retail" ? 12 : 0;

  return Math.round(
    clamp(
      72 +
        (input.reliabilityScore - 7) * 3 -
        (effectiveScamRiskScore - 4) * 6 -
        redFlagPenalty -
        missingProofPenalty +
        positiveSignals.length * 5 +
        (sourceReliabilityScore - 55) * 0.22 +
        (warrantyProtectionScore - 45) * 0.18,
      0,
      100
    )
  );
}

function getMarketCompetitivenessScore(input: DealQualityInput) {
  const ratio = input.askingPrice / input.fairPrice;
  const rangePosition =
    input.askingPrice < input.usedLow
      ? 76
      : input.askingPrice <= input.usedHigh
        ? 72
        : input.askingPrice <= input.usedHigh * 1.15
          ? 54
          : 34;
  const pricePosition = ratio <= 0.85 ? 82 : ratio <= 1 ? 72 : ratio <= 1.12 ? 56 : 36;

  return Math.round(clamp((rangePosition + pricePosition + input.reliabilityScore * 7) / 3, 0, 100));
}

function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 78) {
    return "High";
  }

  if (score >= 58) {
    return "Medium";
  }

  return "Low";
}

function getConfidenceReasons(input: DealQualityInput, confidenceScore: number) {
  const reasons: string[] = [];

  if ((input.productMatchConfidence ?? 75) >= 75) {
    reasons.push("Strong product match");
  } else {
    reasons.push("Product model still needs confirmation");
  }

  if ((input.priceConfidence ?? 74) >= 75) {
    reasons.push("Reliable price extraction or confirmed price");
  } else {
    reasons.push("Price needs confirmation");
  }

  if (getListingCompletenessScore(input) >= 70) {
    reasons.push("Useful listing details provided");
  } else {
    reasons.push("Listing details are incomplete");
  }

  if ((input.extractionConfidence ?? confidenceScore) < 55) {
    reasons.push("Source page did not expose enough readable data");
  }

  return reasons.slice(0, 4);
}

function getMarketPositionLabel({
  dealScore,
  riskLevel,
  confidenceLevel,
  priceRatio
}: {
  dealScore: number;
  riskLevel: RiskLevel;
  confidenceLevel: ConfidenceLevel;
  priceRatio: number;
}) {
  if (riskLevel === "High" && priceRatio <= 0.8) {
    return "High Risk Bargain";
  }

  if (riskLevel === "High" || confidenceLevel === "Low") {
    return "Suspicious Listing";
  }

  if (dealScore >= 88) {
    return "Excellent Deal";
  }

  if (dealScore >= 76) {
    return "Strong Deal";
  }

  if (priceRatio >= 1.18) {
    return "Likely Overpriced";
  }

  if (priceRatio >= 1.06) {
    return "Slightly Overpriced";
  }

  return "Fair Market Price";
}

function getStrictRecommendation({
  dealScore,
  riskLevel,
  priceRatio,
  confidenceLevel
}: {
  dealScore: number;
  riskLevel: RiskLevel;
  priceRatio: number;
  confidenceLevel: ConfidenceLevel;
}): RecommendationLabel {
  if (riskLevel === "High" && confidenceLevel === "Low") {
    return "Avoid";
  }

  if (riskLevel === "High") {
    return "Risky purchase";
  }

  if (priceRatio >= 1.18) {
    return "Overpriced";
  }

  if (dealScore >= 82 && confidenceLevel !== "Low") {
    return "Great deal";
  }

  if (priceRatio >= 0.92 && priceRatio <= 1.08) {
    return "Fair price";
  }

  return dealScore >= 62 ? "Fair price" : "Risky purchase";
}

function buildStrictExplanation({
  input,
  dealScore,
  recommendation,
  confidenceLevel,
  riskLevel,
  redFlags
}: {
  input: DealQualityInput;
  dealScore: number;
  recommendation: RecommendationLabel;
  confidenceLevel: ConfidenceLevel;
  riskLevel: RiskLevel;
  redFlags: RiskSignal[];
}) {
  const difference = Math.round(Math.abs(input.askingPrice - input.fairPrice));

  if (confidenceLevel === "Low") {
    return "BuyWise cannot confidently recommend this yet because the price, product match, or listing details need confirmation.";
  }

  if (riskLevel === "High" || redFlags.some((flag) => flag.severity === "high")) {
    return "The price may look interesting, but the safety signals are not strong enough. Verify proof, ownership, condition, and payment protection before treating this as a real deal.";
  }

  if (recommendation === "Great deal") {
    return `This looks meaningfully below the benchmark by about ${formatCurrency(difference)}, with enough confidence to keep checking it seriously.`;
  }

  if (recommendation === "Overpriced") {
    return `This appears overpriced by about ${formatCurrency(difference)} against the current benchmark. A better buy likely needs a lower price or stronger protections.`;
  }

  if (dealScore < 60) {
    return "The overall score is being held down by weak value, risk, or missing details. This is not a clean yes yet.";
  }

  return "This is close enough to market value to consider, but the final decision depends on proof, condition, and whether better alternatives exist.";
}

function getScoreBreakdown({
  input,
  priceAttractivenessScore,
  trustSafetyScore,
  conditionScore,
  confidenceScore,
  marketCompetitivenessScore,
  redFlags,
  positiveSignals
}: {
  input: DealQualityInput;
  priceAttractivenessScore: number;
  trustSafetyScore: number;
  conditionScore: number;
  confidenceScore: number;
  marketCompetitivenessScore: number;
  redFlags: RiskSignal[];
  positiveSignals: string[];
}) {
  const items: ScoreBreakdownItem[] = [
    {
      label: "Price vs market",
      impact: priceAttractivenessScore >= 75 ? "Helps" : priceAttractivenessScore >= 55 ? "Neutral" : "Hurts",
      detail:
        input.askingPrice < input.fairPrice
          ? `${formatCurrency(input.fairPrice - input.askingPrice)} below the benchmark.`
          : `${formatCurrency(input.askingPrice - input.fairPrice)} above the benchmark.`,
      tone: priceAttractivenessScore >= 75 ? "positive" : priceAttractivenessScore >= 55 ? "neutral" : "negative"
    },
    {
      label: "Trust and safety",
      impact: trustSafetyScore >= 72 ? "Helps" : trustSafetyScore >= 52 ? "Mixed" : "Hurts",
      detail:
        redFlags.length > 0
          ? `${redFlags.length} risk signal${redFlags.length === 1 ? "" : "s"} found.`
          : "No major text-based risk signal found.",
      tone: trustSafetyScore >= 72 ? "positive" : trustSafetyScore >= 52 ? "neutral" : "negative"
    },
    {
      label: "Condition quality",
      impact: conditionScore >= 72 ? "Helps" : conditionScore >= 55 ? "Mixed" : "Hurts",
      detail: "Based on the stated condition and product reliability.",
      tone: conditionScore >= 72 ? "positive" : conditionScore >= 55 ? "neutral" : "negative"
    },
    {
      label: "Listing confidence",
      impact: confidenceScore >= 78 ? "Helps" : confidenceScore >= 58 ? "Mixed" : "Hurts",
      detail: "Based on extraction reliability, price confidence, product match, and listing completeness.",
      tone: confidenceScore >= 78 ? "positive" : confidenceScore >= 58 ? "neutral" : "negative"
    },
    {
      label: "Market competitiveness",
      impact: marketCompetitivenessScore >= 72 ? "Helps" : marketCompetitivenessScore >= 52 ? "Mixed" : "Hurts",
      detail: "Checks whether this price is strong enough versus nearby used or retail benchmarks.",
      tone: marketCompetitivenessScore >= 72 ? "positive" : marketCompetitivenessScore >= 52 ? "neutral" : "negative"
    }
  ];

  if (positiveSignals.length > 0) {
    items.push({
      label: "Proof signals",
      impact: "Helps",
      detail: `${positiveSignals.length} trust signal${positiveSignals.length === 1 ? "" : "s"} mentioned.`,
      tone: "positive"
    });
  }

  return items;
}

function getPros(input: DealQualityInput, positiveSignals: string[], priceAttractivenessScore: number) {
  const pros: string[] = [];

  if (priceAttractivenessScore >= 75) {
    pros.push("Price is meaningfully below the current benchmark.");
  }

  if (input.reliabilityScore >= 8) {
    pros.push("Product has a strong reliability profile.");
  }

  positiveSignals.slice(0, 4).forEach((signal) => pros.push(signal));

  if (input.analysisMode === "retail") {
    pros.push("Retail source may include stronger return or warranty protection.");
  }

  return [...new Set(pros)].slice(0, 5);
}

function getCons(input: DealQualityInput, redFlags: RiskSignal[], confidenceLevel: ConfidenceLevel, trustSafetyScore: number) {
  const cons = redFlags.slice(0, 4).map((flag) => flag.label);

  if (confidenceLevel === "Low") {
    cons.push("Analysis confidence is low.");
  }

  if (trustSafetyScore < 60) {
    cons.push("Trust and safety score is weak.");
  }

  if (input.askingPrice > input.fairPrice * 1.08) {
    cons.push("Price is above the current benchmark.");
  }

  if ((input.listingText?.trim().length ?? 0) < 80) {
    cons.push("Listing details are thin.");
  }

  return [...new Set(cons)].slice(0, 5);
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
  const priceRatio = input.askingPrice / input.fairPrice;
  const riskLevel = getRiskLevel(effectiveScamRiskScore, input.reliabilityScore, input.condition, redFlags);
  const sourceReliabilityScore = getSourceReliabilityScore(input);
  const warrantyProtectionScore = getWarrantyProtectionScore(input, positiveSignals);
  const listingCompletenessScore = getListingCompletenessScore(input);
  const priceAttractivenessScore = getPriceAttractivenessScore(input, effectiveScamRiskScore);
  const trustSafetyScore = getTrustSafetyScore({
    input,
    redFlags,
    positiveSignals,
    effectiveScamRiskScore,
    sourceReliabilityScore,
    warrantyProtectionScore
  });
  const conditionScore = Math.round(
    clamp(70 + getConditionAdjustment(input.condition) + (input.reliabilityScore - 7) * 4, 0, 100)
  );
  const marketCompetitivenessScore = getMarketCompetitivenessScore(input);
  const confidenceScore = Math.round(
    clamp(
      ((input.extractionConfidence ?? 72) * 0.22 +
        (input.priceConfidence ?? 74) * 0.26 +
        (input.productMatchConfidence ?? 74) * 0.24 +
        listingCompletenessScore * 0.18 +
        sourceReliabilityScore * 0.1),
      0,
      100
    )
  );

  let dealScore = Math.round(
    clamp(
      priceAttractivenessScore * 0.3 +
        trustSafetyScore * 0.3 +
        conditionScore * 0.15 +
        marketCompetitivenessScore * 0.15 +
        confidenceScore * 0.1,
      0,
      100
    )
  );

  const hasStrongProof = positiveSignals.length >= 3 || warrantyProtectionScore >= 76;
  if (riskLevel === "High") {
    dealScore = Math.min(dealScore, hasStrongProof && confidenceScore >= 75 ? 72 : 65);
  }

  if (priceRatio <= 0.55) {
    dealScore = Math.min(dealScore, hasStrongProof ? 72 : 66);
  }

  if (confidenceScore < 45) {
    dealScore = Math.min(dealScore, 55);
  } else if (confidenceScore < 58) {
    dealScore = Math.min(dealScore, 64);
  }

  if ((input.productMatchConfidence ?? 74) < 70) {
    dealScore = Math.min(dealScore, 60);
  }

  if ((input.priceConfidence ?? 74) < 65) {
    dealScore = Math.min(dealScore, 60);
  }

  if (redFlags.some((flag) => flag.severity === "high")) {
    dealScore = Math.min(dealScore, 62);
  }

  const confidenceLevel = getConfidenceLevel(confidenceScore);
  const recommendation = getStrictRecommendation({
    dealScore,
    riskLevel,
    priceRatio,
    confidenceLevel
  });
  const marketPositionLabel = getMarketPositionLabel({
    dealScore,
    riskLevel,
    confidenceLevel,
    priceRatio
  });

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
    explanation: buildStrictExplanation({
      input,
      dealScore,
      recommendation,
      confidenceLevel,
      riskLevel,
      redFlags
    }),
    suggestedOfferLow: Math.round(suggestedOfferLow),
    suggestedOfferHigh: Math.round(Math.max(suggestedOfferHigh, suggestedOfferLow)),
    riskLevel,
    priceDifference: Math.round(input.askingPrice - input.fairPrice),
    confidenceScore,
    confidenceLevel,
    confidenceReasons: getConfidenceReasons(input, confidenceScore),
    marketPositionLabel,
    priceAttractivenessScore,
    trustSafetyScore,
    conditionScore,
    marketCompetitivenessScore,
    scoreBreakdown: getScoreBreakdown({
      input,
      priceAttractivenessScore,
      trustSafetyScore,
      conditionScore,
      confidenceScore,
      marketCompetitivenessScore,
      redFlags,
      positiveSignals
    }),
    pros: getPros(input, positiveSignals, priceAttractivenessScore),
    cons: getCons(input, redFlags, confidenceLevel, trustSafetyScore),
    dataSources: [
      input.analysisMode === "retail" ? "Retail page details or confirmed sale price" : "Listing details or confirmed seller price",
      input.analysisMode === "retail" ? "Retail MSRP benchmark" : "Used fair-value benchmark",
      "BuyWise internal product benchmarks"
    ],
    redFlags,
    positiveSignals,
    negotiationTip: getNegotiationTip(input, riskLevel),
    nextSteps: getNextSteps(input, riskLevel, redFlags)
  };
}
