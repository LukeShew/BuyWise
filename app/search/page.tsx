import { PhotoFeedSearch } from "@/components/PhotoFeedSearch";

export default function SearchPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8">
        <p className="text-sm font-semibold text-mint">Recent photo checks</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-black leading-tight text-ink sm:text-5xl">
          Products people checked today.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-700">
          Approved photo analyses appear here for 24 hours. Raw screenshots stay private, and rejected or inappropriate uploads are never shown.
        </p>
      </section>

      <PhotoFeedSearch />
    </main>
  );
}
