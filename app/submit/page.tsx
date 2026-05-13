import { Camera, ImagePlus, ShieldAlert } from "lucide-react";

import { PhotoAnalyzerForm } from "@/components/PhotoAnalyzerForm";

export default function SubmitListingPage() {
  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <section className="mb-6 grid gap-5 lg:grid-cols-[1fr_390px] lg:items-end">
        <div>
          <p className="text-sm font-semibold text-mint">Photo analyzer</p>
          <h1 className="mt-2 max-w-4xl text-4xl font-black leading-tight text-ink sm:text-5xl">
            Upload a product photo. Know if it is worth buying.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-700">
            Add marketplace screenshots, retail pages, checkout screens, or photos of the item. BuyWise checks whether it looks like a real product for sale before scoring it.
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            {[
              {
                icon: ImagePlus,
                title: "Upload multiple photos",
                text: "Drag and drop, import from your phone, or take a fresh photo."
              },
              {
                icon: Camera,
                title: "Reject bad uploads",
                text: "Non-products, unsafe products, and inappropriate uploads do not get scored or shown in Search."
              },
              {
                icon: ShieldAlert,
                title: "Show only safe cards",
                text: "Search displays temporary extracted product cards, not raw private screenshots."
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

      <PhotoAnalyzerForm />
    </main>
  );
}
