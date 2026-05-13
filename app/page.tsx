import {
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  ClipboardCheck,
  MessageSquareText,
  ShieldCheck,
  ShoppingBag
} from "lucide-react";
import { PhotoAnalyzerForm } from "@/components/PhotoAnalyzerForm";

const checks = [
  "Analyze listing screenshots",
  "Check product photos",
  "Reject non-products",
  "Post safe cards for 24 hours"
];

const verdictFeatures = [
  {
    icon: AlertTriangle,
    title: "Risk check",
    text: "Flags rushed payment, missing proof, locks, vague answers, and prices that look too good."
  },
  {
    icon: BadgeDollarSign,
    title: "Price check",
    text: "Reads visible prices from photos and treats a price you type yourself as confirmed."
  },
  {
    icon: ShoppingBag,
    title: "Better options",
    text: "Checks configured market sources for comparable products when available."
  },
  {
    icon: MessageSquareText,
    title: "Public feed",
    text: "Approved products can appear in Search for 24 hours without exposing raw screenshots."
  }
];

const outputHighlights = [
  {
    label: "Verdict",
    value: "Buy, negotiate, verify, or pass",
    text: "The result starts with the decision, not a pile of generic advice."
  },
  {
    label: "Money",
    value: "Price confidence + offer range",
    text: "See whether the price was read cleanly and what number is reasonable to start with."
  },
  {
    label: "Proof",
    value: "Photo-based evidence",
    text: "BuyWise looks for visible product, listing, price, condition, and source clues."
  }
];

const exampleReasons = [
  "Screenshot is missing proof of condition",
  "Price is cheap enough to need extra caution",
  "Market price could not be verified from configured sources"
];

export default function LandingPage() {
  return (
    <main>
      <section className="border-b border-stone-200 bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700 shadow-sm sm:text-sm">
              <ShieldCheck className="h-4 w-4 text-mint" aria-hidden />
              Built for used buyers, deal hunters, and anyone checking before they pay
            </div>
            <h1 className="mt-4 text-4xl font-black leading-tight text-ink sm:text-[2.8rem] lg:text-[3.15rem] lg:leading-[1.08]">
              Upload a product photo. Know if it is worth buying.
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-stone-700 sm:text-lg">
              Add listing screenshots, checkout pages, retail product pages, or item photos. BuyWise checks whether the photo looks like a real product for sale before scoring it.
            </p>
          </div>

          <div className="mx-auto mt-5 max-w-4xl">
            <PhotoAnalyzerForm />
          </div>

          <div className="mx-auto mt-5 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {checks.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-stone-200 bg-white px-3 py-3 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint" aria-hidden />
                <p className="text-sm font-semibold leading-6 text-stone-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="flex h-full flex-col">
            <p className="text-sm font-semibold text-mint">What you get back</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-ink">
              Know whether to buy, negotiate, verify, or walk away.
            </h2>
            <p className="mt-3 leading-7 text-stone-600">
              Upload photos and BuyWise turns the messy listing into a clear buyer call: what it is worth, what feels risky, and whether it should appear in Search.
            </p>
            <div className="mt-5 grid gap-3">
              {outputHighlights.map((item) => (
                <div key={item.label} className="rounded-lg border border-stone-200 bg-paper p-4">
                  <p className="text-xs font-bold uppercase tracking-normal text-mint">{item.label}</p>
                  <p className="mt-1 font-bold text-ink">{item.value}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {verdictFeatures.map((item) => (
              <div key={item.title} className="rounded-lg border border-stone-200 bg-paper p-5">
                <item.icon className="h-5 w-5 text-mint" aria-hidden />
                <h3 className="mt-4 font-bold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div>
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-mint">Example analysis</p>
            <h2 className="mt-2 text-3xl font-black text-ink">What a verdict looks like</h2>
            <p className="mt-3 leading-7 text-stone-600">
              BuyWise should be strict. If the photo has missing proof, weak extraction, or no confirmed market price, the score stays cautious.
            </p>
          </div>

          <section className="mt-6 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-soft">
            <div className="border-b border-stone-200 bg-ink p-5 text-white">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-mint">Example verdict</p>
                  <h3 className="mt-1 text-3xl font-black">Needs more proof</h3>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold text-stone-200">
                    <span className="rounded-full bg-white/10 px-3 py-1">Product photo</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">Price needs confirmation</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">Scored from visible details</span>
                  </div>
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-200">
                    BuyWise can review the photos and risk signals, but it will not call something a great deal unless the price and product details are reliable.
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-950">
                  Verify before offer
                </span>
              </div>
            </div>

            <div className="grid gap-4 bg-orange-50/40 p-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
                  <p className="text-sm text-stone-500">Deal score</p>
                  <p className="mt-1 text-2xl font-black text-ink">54/100</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
                  <p className="text-sm text-stone-500">Scam probability</p>
                  <p className="mt-1 text-2xl font-black text-ink">7/10</p>
                  <p className="mt-1 text-xs leading-5 text-stone-500">Higher means more likely to be a scam.</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
                  <p className="text-sm text-stone-500">Market check</p>
                  <p className="mt-1 text-2xl font-black text-ink">Unverified</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
                  <p className="text-sm text-stone-500">Suggested offer</p>
                  <p className="mt-1 text-2xl font-black text-ink">$390-$410</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
                  <h4 className="flex items-center gap-2 font-bold text-ink">
                    <AlertTriangle className="h-4 w-4 text-danger" aria-hidden />
                    Why BuyWise is cautious
                  </h4>
                  <div className="mt-3 space-y-2">
                    {exampleReasons.map((item) => (
                      <div key={item} className="rounded-lg bg-stone-50 p-3 text-sm leading-6 text-stone-700">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-stone-200">
                  <h4 className="flex items-center gap-2 font-bold text-ink">
                    <ClipboardCheck className="h-4 w-4 text-mint" aria-hidden />
                    Search eligibility
                  </h4>
                  <p className="mt-3 rounded-lg bg-stone-50 p-3 text-sm leading-6 text-stone-700">
                    If the upload clearly shows an appropriate product for sale, BuyWise can add a safe extracted card to Search for 24 hours.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
