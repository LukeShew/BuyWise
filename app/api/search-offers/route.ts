import { NextResponse } from "next/server";

import { searchLiveOffers } from "@/services/liveOfferService";
import type { LiveOfferSearchResponse } from "@/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const limit = Number(url.searchParams.get("limit") ?? "8");

  if (!query) {
    const response: LiveOfferSearchResponse = {
      ok: false,
      query,
      offers: [],
      providerStatuses: [],
      message: "Search for a product to check live offers."
    };
    return NextResponse.json(response);
  }

  const { offers, providerStatuses } = await searchLiveOffers({
    query,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 16) : 8
  });
  const configuredProviders = providerStatuses.filter((provider) => provider.status === "configured").length;
  const missingProviders = providerStatuses.filter((provider) => provider.status === "missing_config").length;
  const response: LiveOfferSearchResponse = {
    ok: offers.length > 0,
    query,
    offers,
    providerStatuses,
    message:
      offers.length > 0
        ? `Found ${offers.length} live offer${offers.length === 1 ? "" : "s"}.`
        : configuredProviders === 0 && missingProviders > 0
          ? "Live offer providers are not configured yet. Add API credentials to return real product cards."
          : "No reliable live offers found for that search."
  };

  return NextResponse.json(response);
}
