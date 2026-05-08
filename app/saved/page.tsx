import { SavedItemsClient } from "@/components/SavedItemsClient";

export default function SavedItemsPage() {
  return (
    <main className="mx-auto min-h-[70vh] max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold text-mint">Saved items</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Track listings you are considering</h1>
        <p className="mt-3 leading-7 text-stone-600">
          Bookmark product guides or save analyzed link verdicts, then track price, source, notes, and status.
        </p>
      </div>
      <SavedItemsClient />
    </main>
  );
}
