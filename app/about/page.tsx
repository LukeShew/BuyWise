import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileText,
  Link2,
  MessageSquareText,
  PlugZap,
  ShoppingBag,
  Sparkles
} from "lucide-react";
import { mockProducts, supportedCategories } from "@/data/mockProducts";
import { formatCurrency } from "@/lib/format";

const valueCards = [
  {
    icon: Link2,
    title: "Start with a link",
    text: "Paste a resale listing or retail product page. BuyWise tries to pull the product, price, source, and page details automatically."
  },
  {
    icon: BadgeDollarSign,
    title: "See if the price makes sense",
    text: "The analyzer compares the link price against used fair-value and retail MSRP benchmarks from the current BuyWise catalog."
  },
  {
    icon: AlertTriangle,
    title: "Catch risky listings",
    text: "BuyWise flags suspicious seller wording, missing proof, rushed payment, locked devices, vague condition notes, and prices that look too low."
  },
  {
    icon: ShoppingBag,
    title: "Compare better options",
    text: "If the link looks weak, BuyWise shows better resale or retail moves from the catalog when there is a stronger choice."
  }
];

const steps = [
  "Paste the product or listing link.",
  "Review anything BuyWise was able to auto-fill.",
  "Run the analyzer and read the verdict.",
  "Use the offer range, questions, checklist, and alternatives before buying."
];

const audiences = [
  "Students buying laptops or MacBooks",
  "Creators buying used cameras",
  "Parents buying used gear",
  "People checking bikes, monitors, and electronics",
  "Anyone who wants a second opinion before paying"
];

const outputs = [
  "Deal verdict",
  "Risk level",
  "Confidence score",
  "Suggested offer or buy-under range",
  "Why it might not be worth it",
  "Questions to ask the seller",
  "Buyer checklist",
  "Resale and retail alternatives"
];

export default function AboutPage() {
  const totalMsrp = mockProducts.reduce((sum, product) => sum + product.msrp, 0);
  const totalFair = mockProducts.reduce((sum, product) => sum + product.fairPrice, 0);
  const stats = [
    {
      icon: FileText,
      label: "MSRP tracked",
      value: formatCurrency(totalMsrp),
      text: "Retail prices used for comparison."
    },
    {
      icon: PlugZap,
      label: "Used fair value tracked",
      value: formatCurrency(totalFair),
      text: "Used price benchmarks used for deal checks."
    },
    {
      icon: ShoppingBag,
      label: "Categories covered",
      value: supportedCategories.length.toString(),
      text: "Laptops, cameras, bikes, and monitors."
    },
    {
      icon: Database,
      label: "Product guides",
      value: mockProducts.length.toString(),
      text: "Focused guides for common used buys."
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
                Know if a used listing or retail deal is worth buying before you pay.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">
                BuyWise helps normal buyers check product links from places like eBay, Craigslist, OfferUp, retail stores, and local sellers. It gives a plain-English verdict, flags risk, and suggests what to do next.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  prefetch={false}
                  className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-ink px-5 font-bold text-white transition hover:bg-stone-800"
                >
                  Check a link
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/search"
                  prefetch={false}
                  className="focus-ring inline-flex h-12 items-center justify-center rounded-lg border border-stone-200 bg-white px-5 font-semibold text-ink transition hover:border-mint"
                >
                  Browse price guides
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-5 max-w-2xl">
                <p className="text-sm font-semibold text-mint">Current coverage</p>
                <h2 className="mt-2 text-2xl font-black text-ink sm:text-3xl">What BuyWise can check today</h2>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  The current preview covers focused categories with price benchmarks, category-specific questions, and buyer checklists.
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
          <h2 className="mt-2 text-3xl font-black text-ink">A second opinion for used and retail product links</h2>
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
            <h2 className="mt-2 text-3xl font-black text-ink">From pasted link to buyer decision</h2>
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
            BuyWise is for people who want a fast, practical answer before they message a seller, meet in person, or check out online.
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
              <p className="text-sm font-semibold text-mint">Current preview</p>
              <h2 className="mt-1 text-3xl font-black">BuyWise is improving quickly</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-stone-200">
            This version uses a starter catalog for cameras, laptops, bikes, and monitors. Link reading works when a public page exposes readable product data. If a site blocks access, BuyWise still lets you paste the missing details and run the analyzer.
          </p>
          <div className="mt-5 rounded-lg bg-white/10 p-4">
            <h3 className="flex items-center gap-2 font-bold">
              <MessageSquareText className="h-4 w-4 text-mint" aria-hidden />
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
