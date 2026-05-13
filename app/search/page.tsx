import { LiveOfferSearch } from "@/components/LiveOfferSearch";

export default function SearchPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8">
        <p className="text-sm font-semibold text-mint">Live product search</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-black leading-tight text-ink sm:text-5xl">
          Find real offers before you buy.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-700">
          Search live retailer and marketplace data when provider APIs are configured. BuyWise only shows cards returned from real sources, not preset sample products.
        </p>
      </section>

      <LiveOfferSearch />
    </main>
  );
}
