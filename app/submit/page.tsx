import { ClipboardPaste, ShieldAlert, Target } from "lucide-react";
import { ListingAnalyzerForm } from "@/components/ListingAnalyzerForm";

export default async function SubmitListingPage({
  searchParams
}: {
  searchParams?: Promise<{ draft?: string }>;
}) {
  const params = await searchParams;
  const isHomeDraft = params?.draft === "home";

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      {!isHomeDraft ? (
        <section className="mb-6 grid gap-5 lg:grid-cols-[1fr_390px] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-mint">Listing analyzer</p>
            <h1 className="mt-2 max-w-4xl text-4xl font-black leading-tight text-ink sm:text-5xl">
              Check if this is the best place to buy
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-700">
              Drop a resale or retail link, add the price and product/model, and BuyWise rates the bargain against used fair value and retail MSRP benchmarks.
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <div className="space-y-3">
              {[
                {
                  icon: ClipboardPaste,
                  title: "Start with the link",
                  text: "The MVP detects source/type from the URL, then uses your pasted price and details."
                },
                {
                  icon: ShieldAlert,
                  title: "Compare both sides",
                  text: "A retail deal may lose to used pricing. A used listing may lose to buying new."
                },
                {
                  icon: Target,
                  title: "Act only when better",
                  text: "BuyWise shows alternatives only when the current mock catalog has a stronger option."
                }
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <item.icon className="mt-1 h-4 w-4 shrink-0 text-mint" aria-hidden />
                  <div>
                    <p className="text-sm font-bold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-sm leading-5 text-stone-600">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ListingAnalyzerForm autoAnalyzeDraft={isHomeDraft} focusResultOnAnalyze />
    </main>
  );
}
