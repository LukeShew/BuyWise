import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Search,
  ShieldCheck,
  Sparkles
} from "lucide-react";

const valueCards = [
  {
    icon: Camera,
    title: "Upload product photos",
    text: "Add screenshots, marketplace photos, checkout pages, or product sale images. BuyWise reads what is visible and rejects uploads that are not sale-related products."
  },
  {
    icon: BadgeDollarSign,
    title: "Confirm the price",
    text: "If you enter the price yourself, BuyWise treats that price as confirmed and shows that clearly in the verdict."
  },
  {
    icon: AlertTriangle,
    title: "Catch risky details",
    text: "The analyzer looks for thin details, suspicious wording, unclear condition, missing price context, and anything that should lower confidence."
  },
  {
    icon: Search,
    title: "Find recent checks",
    text: "Approved product cards can appear in Search for 24 hours. Raw uploaded photos stay private."
  }
];

const steps = [
  "Upload or drag in one or more product/listing photos.",
  "Enter the price if the image does not show it clearly.",
  "BuyWise checks the product, price, visible details, and market context.",
  "Read the verdict before deciding whether to keep shopping or move on."
];

const audiences = [
  "Students buying laptops or MacBooks",
  "Creators buying used cameras",
  "Parents buying used gear",
  "People checking bikes, monitors, and electronics",
  "Anyone who wants a second opinion before paying"
];

const outputs = [
  "Deal score",
  "Market position",
  "Confidence level",
  "Suggested offer or buy range",
  "Why this score",
  "Pros and cons",
  "Red flags",
  "Better options when available"
];

export default function AboutPage() {
  const stats = [
    {
      icon: Camera,
      label: "Main input",
      value: "Photos",
      text: "Built around screenshots and product images."
    },
    {
      icon: ShieldCheck,
      label: "Privacy",
      value: "Private uploads",
      text: "Original photos are not shown publicly in Search."
    },
    {
      icon: BadgeDollarSign,
      label: "Price handling",
      value: "User-confirmed",
      text: "Manual prices are treated as confirmed."
    },
    {
      icon: ClipboardCheck,
      label: "Search feed",
      value: "24 hours",
      text: "Approved extracted product cards expire automatically."
    }
  ];

  return (
    <main>
      <section className="border-b border-stone-200 bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold text-mint">About Us</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-ink sm:text-5xl">
                Know if a product photo shows a deal worth buying.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">
                BuyWise helps normal buyers check screenshots and product photos before they pay. It gives a plain-English verdict, explains risk, and keeps the score cautious when the details are unclear.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  prefetch={false}
                  className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-ink px-5 font-bold text-white transition hover:bg-stone-800"
                >
                  Analyze photos
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-5 max-w-2xl">
                <p className="text-sm font-semibold text-mint">Current coverage</p>
                <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">What BuyWise checks today</h2>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  BuyWise reads uploaded images, uses confirmed prices when provided, searches configured market providers when available, and avoids publishing low-confidence or inappropriate uploads.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-stone-200 bg-paper p-4">
                    <stat.icon className="h-5 w-5 text-mint" aria-hidden />
                    <p className="mt-3 text-sm text-stone-500">{stat.label}</p>
                    <p className="mt-1 text-2xl font-black text-ink">{stat.value}</p>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{stat.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-semibold text-mint">What it does</p>
          <h2 className="mt-2 text-3xl font-black text-ink">A second opinion from the photo evidence</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {valueCards.map((item) => (
            <div key={item.title} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <item.icon className="h-6 w-6 text-mint" aria-hidden />
              <h3 className="mt-4 font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-mint">How it works</p>
            <h2 className="mt-2 text-3xl font-black text-ink">From upload to buyer decision</h2>
            <div className="mt-5 space-y-3">
              {steps.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-lg bg-paper p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold leading-7 text-stone-700">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-mint">What you get</p>
            <h2 className="mt-2 text-3xl font-black text-ink">Clear output you can act on</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {outputs.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg bg-paper p-3">
                  <ClipboardCheck className="h-4 w-4 shrink-0 text-mint" aria-hidden />
                  <p className="text-sm font-semibold text-stone-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold text-mint">Who it helps</p>
          <h2 className="mt-2 text-3xl font-black text-ink">Built for regular buyers, not resale experts</h2>
          <p className="mt-3 leading-7 text-stone-600">
            BuyWise is for people who want a practical check before they message a seller, meet in person, or check out online.
          </p>
          <div className="mt-5 space-y-2">
            {audiences.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-mint" aria-hidden />
                <p className="text-sm leading-6 text-stone-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-ink p-6 text-white shadow-sm">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-6 w-6 text-mint" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-mint">Built for practical checks</p>
              <h2 className="mt-1 text-3xl font-black">A clearer way to judge a possible buy</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-stone-200">
            BuyWise works best when the upload clearly shows the product, price, condition, and source. If the image is unclear or the market data is thin, the verdict says that instead of pretending the answer is certain.
          </p>
          <div className="mt-5 rounded-lg bg-white/10 p-4">
            <h3 className="flex items-center gap-2 font-bold">
              <ShieldCheck className="h-4 w-4 text-mint" aria-hidden />
              The goal
            </h3>
            <p className="mt-2 text-sm leading-6 text-stone-200">
              Help buyers avoid scams, stop overpaying, and feel more confident before they spend money.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
