import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <p className="text-sm font-semibold text-mint">Not found</p>
      <h1 className="mt-2 text-4xl font-black text-ink">This product is not in the current benchmarks</h1>
      <p className="mt-3 text-stone-600">Search current products or check a product link.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/search" className="focus-ring rounded-lg bg-ink px-4 py-2 font-semibold text-white hover:bg-stone-800">
          Search products
        </Link>
        <Link href="/" className="focus-ring rounded-lg border border-stone-200 bg-white px-4 py-2 font-semibold text-stone-700 hover:border-mint hover:text-ink">
          Analyze listing
        </Link>
      </div>
    </main>
  );
}
