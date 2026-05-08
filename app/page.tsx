import Link from "next/link";
import {
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  ClipboardCheck,
  MessageSquareText,
  Search,
  ShieldCheck,
  ShoppingBag,
  Target
} from "lucide-react";
import { HomeListingPrompt } from "@/components/HomeListingPrompt";
import { ProductCard } from "@/components/ProductCard";
import { mockProducts } from "@/data/mockProducts";
import { formatCurrency } from "@/lib/format";

const checks = [
  "Rate resale listings",
  "Rate retail bargains",
  "Compare used vs new",
  "Show better alternatives when the catalog has them"
];

const verdictFeatures = [
  {
    icon: AlertTriangle,
    title: "Trap detection",
    text: "Flags rushed payment, stock photos, locks, no receipt, vague answers, and prices that look too good."
  },
  {
    icon: BadgeDollarSign,
    title: "Price verdict",
    text: "Compares the pasted link price against used fair value or retail MSRP, depending on what the buyer is checking."
  },
  {
    icon: ShoppingBag,
    title: "Retail and resale alternatives",
    text: "Shows better used options and retail MSRP benchmarks when the current mock catalog has a stronger choice."
  },
  {
    icon: MessageSquareText,
    title: "Buyer next steps",
    text: "Turns the risk signals into questions, offer guidance, and a checklist before messaging or buying."
  }
];

export default function LandingPage() {
  const featured = mockProducts.filter((product) =>
    ["macbook-air-m1-2020", "sony-a6400-2019", "trek-fx-3-2022", "dell-ultrasharp-u2720q-2020"].includes(product.id)
  );

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
              Paste a resale or retail link. BuyWise rates the bargain, checks risk, and compares it against used and retail alternatives when the current catalog has a better option.
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
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold text-mint">What you get back</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-ink">
              A verdict that compares the link, not just the product
            </h2>
            <p className="mt-3 leading-7 text-stone-600">
              The current MVP uses mock pricing, but the flow is link-first: pull what the page exposes, rate this place to buy, then show better used or retail choices if they exist.
            </p>
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-mint">Popular buyer guides</p>
              <h2 className="mt-2 text-3xl font-black text-ink">Example Products</h2>
            </div>
            <Link
              href="/search"
              prefetch={false}
              className="focus-ring inline-flex items-center gap-2 rounded-lg font-semibold text-ink hover:text-mint sm:ml-auto"
            >
              <Search className="h-4 w-4" aria-hidden />
              Browse all products
            </Link>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <aside className="mt-6 rounded-lg border border-stone-200 bg-ink p-5 text-white shadow-soft">
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr_1fr] lg:items-center">
              <div className="flex items-start gap-3">
                <Target className="mt-1 h-5 w-5 shrink-0 text-mint" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-mint">Example verdict</p>
                  <h3 className="mt-1 text-2xl font-black">Risky purchase</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-200">
                    Cheap enough to be interesting, but the seller has not shown proof. Ask for a working video, serial number, and public meetup before making an offer.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/10 p-3">
                  <p className="text-xs text-stone-300">Fair used price</p>
                  <p className="mt-1 text-lg font-black">{formatCurrency(525)}</p>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <p className="text-xs text-stone-300">Offer range</p>
                  <p className="mt-1 text-lg font-black">$390-$410</p>
                </div>
              </div>

              <div className="grid gap-2">
                {["No receipt mentioned", "Check used alternatives", "Compare retail MSRP"].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold">
                    <ClipboardCheck className="h-4 w-4 shrink-0 text-mint" aria-hidden />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
