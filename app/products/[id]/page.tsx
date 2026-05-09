import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, ExternalLink, Gauge, ShieldAlert } from "lucide-react";
import { BuyingChecklist } from "@/components/BuyingChecklist";
import { CommonIssuesList } from "@/components/CommonIssuesList";
import { DepreciationChart } from "@/components/DepreciationChart";
import { ListingAnalyzerForm } from "@/components/ListingAnalyzerForm";
import { PriceSummaryCard } from "@/components/PriceSummaryCard";
import { ProductCard } from "@/components/ProductCard";
import { RecommendationBadge } from "@/components/RecommendationBadge";
import { SaveProductButton } from "@/components/SaveProductButton";
import { ScamWarnings } from "@/components/ScamWarnings";
import { SellerQuestions } from "@/components/SellerQuestions";
import { findProductById, getAlternativeProducts, mockProducts } from "@/data/mockProducts";
import { formatCurrency } from "@/lib/format";
import { getMarketplaceSignals } from "@/services/priceAnalysisService";

export function generateStaticParams() {
  return mockProducts.map((product) => ({ id: product.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = findProductById(id);

  if (!product) {
    return {
      title: "Product not found"
    };
  }

  return {
    title: `${product.brand} ${product.model} used price insight`
  };
}

export default async function ProductInsightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = findProductById(id);

  if (!product) {
    notFound();
  }

  const alternatives = getAlternativeProducts(product);
  const marketplaceListings = await getMarketplaceSignals(product);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/search"
        className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-stone-600 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to search
      </Link>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-mint ring-1 ring-stone-200">
              {product.category}
            </span>
            <span className="text-sm font-medium text-stone-500">{product.year}</span>
          </div>
          <h1 className="mt-4 text-4xl font-black text-ink sm:text-5xl">
            {product.brand} {product.model}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-700">
            {product.recommendationExplanation}
          </p>
        </div>

        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-mint">Recommendation</p>
              <h2 className="mt-1 text-2xl font-bold text-ink">{product.recommendation}</h2>
            </div>
            <RecommendationBadge label={product.recommendation} />
          </div>
          <p className="mt-4 leading-7 text-stone-700">{product.recommendationExplanation}</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-stone-50 p-3">
              <p className="text-xs text-stone-500">Reliability</p>
              <p className="mt-1 text-lg font-black text-ink">{product.reliabilityScore}/10</p>
            </div>
            <div className="rounded-lg bg-stone-50 p-3">
              <p className="text-xs text-stone-500">Demand</p>
              <p className="mt-1 text-lg font-black text-ink">{product.demandScore}/10</p>
            </div>
            <div className="rounded-lg bg-stone-50 p-3">
              <p className="text-xs text-stone-500">Scam probability</p>
              <p className="mt-1 text-lg font-black text-ink">{product.scamRiskScore}/10</p>
              <p className="mt-1 text-xs leading-5 text-stone-500">Higher is worse.</p>
            </div>
          </div>
        </section>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <PriceSummaryCard product={product} />
          <DepreciationChart product={product} />
          <CommonIssuesList issues={product.commonIssues} />
          <SellerQuestions questions={product.sellerQuestions} />
          <ScamWarnings scamRiskScore={product.scamRiskScore} />
          <BuyingChecklist items={product.buyingChecklist} />
          <ListingAnalyzerForm initialProduct={product} />
        </div>

        <aside className="space-y-6">
          <SaveProductButton product={product} />

          <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Gauge className="mt-1 h-5 w-5 text-mint" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-mint">Model notes</p>
                <h2 className="mt-1 text-xl font-bold text-ink">Best buys and avoids</h2>
              </div>
            </div>
            <div className="mt-5 space-y-5">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-ink">
                  <BadgeCheck className="h-4 w-4 text-mint" aria-hidden />
                  Best years/models
                </h3>
                <ul className="mt-3 space-y-2">
                  {product.bestYearsModels.map((item) => (
                    <li key={item} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-900">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="flex items-center gap-2 font-bold text-ink">
                  <ShieldAlert className="h-4 w-4 text-danger" aria-hidden />
                  Models to avoid
                </h3>
                <ul className="mt-3 space-y-2">
                  {product.modelsToAvoid.map((item) => (
                    <li key={item} className="rounded-lg bg-red-50 px-3 py-2 text-sm leading-6 text-red-900">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-mint">Marketplace signals</p>
            <h2 className="mt-1 text-xl font-bold text-ink">Example listings</h2>
            <div className="mt-4 space-y-3">
              {marketplaceListings.map((listing) => (
                <a
                  key={`${listing.source}-${listing.title}-${listing.price}`}
                  href={listing.url}
                  className="focus-ring block rounded-lg border border-stone-100 bg-stone-50 p-3 transition hover:border-mint"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-ink">{listing.title}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {listing.source} - {listing.condition} - {listing.location}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
                  </div>
                  <p className="mt-2 text-lg font-black text-ink">{formatCurrency(listing.price)}</p>
                </a>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="mt-10">
        <div className="mb-5">
          <p className="text-sm font-semibold text-mint">Alternatives</p>
          <h2 className="mt-1 text-3xl font-black text-ink">Similar used buys to compare</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {alternatives.map((alternative) => (
            <ProductCard key={alternative.id} product={alternative} />
          ))}
        </div>
      </section>
    </main>
  );
}
