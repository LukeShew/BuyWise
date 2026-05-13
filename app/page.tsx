import {
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  ClipboardCheck,
  MessageSquareText,
  ShieldCheck,
  ShoppingBag
} from "lucide-react";
import { HomeListingPrompt } from "@/components/HomeListingPrompt";

const checks = [
  "Rate resale listings",
  "Rate retail bargains",
  "Check price confidence",
  "Show what still needs proof"
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
    text: "Checks whether the extracted price is reliable enough to score or needs manual confirmation."
  },
  {
    icon: ShoppingBag,
    title: "Better options",
    text: "Calls out when BuyWise needs more data before claiming there is a better place to buy."
  },
  {
    icon: MessageSquareText,
    title: "Next move",
    text: "Turns the verdict into an offer range, seller questions, and a short checklist before buying."
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
    value: "Questions and checklist",
    text: "Know what to ask before messaging, meeting, or checking out."
  }
];

const exampleReasons = [
  "No receipt or serial number mentioned",
  "Cheap enough to need extra proof",
  "Public meetup and working video should come before any offer"
];

const exampleQuestions = [
  "Can you send a working video with today's date?",
  "Do you have the receipt or serial number?",
  "Can I test it before paying?"
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
              Drop a product link. Know if it is the best place to buy.
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-stone-700 sm:text-lg">
              Paste a resale or retail link. BuyWise checks what the page exposes, flags risk, and tells you what still needs confirmation before you buy.
            </p>
          </div>

          <div className="mx-auto mt-5 max-w-4xl">
            <HomeListingPrompt />
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
              Paste a link and BuyWise turns the messy listing into a clear buyer call: what it is worth, what feels risky, and what to do next.
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
              BuyWise should be strict. If the link has missing proof, weak extraction, or no confirmed market price, the score stays cautious.
            </p>
          </div>

          <section className="mt-6 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-soft">
            <div className="border-b border-stone-200 bg-ink p-5 text-white">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-mint">Example verdict</p>
                  <h3 className="mt-1 text-3xl font-black">Needs more proof</h3>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold text-stone-200">
                    <span className="rounded-full bg-white/10 px-3 py-1">Product link</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">Price needs confirmation</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">Scored from link details</span>
                  </div>
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-200">
                    BuyWise can review the link and risk signals, but it will not call something a great deal unless the price and product details are reliable.
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
                    What to ask next
                  </h4>
                  <div className="mt-3 space-y-2">
                    {exampleQuestions.map((item) => (
                      <div key={item} className="rounded-lg bg-stone-50 p-3 text-sm leading-6 text-stone-700">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
