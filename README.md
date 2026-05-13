# BuyWise

BuyWise helps shoppers check a product link before they buy. Paste a resale listing or retail product page, and BuyWise gives a plain-English verdict on whether that link looks safe enough to keep checking, what risks to verify, and what price range to treat cautiously.

Live site:

```text
https://trybuywise.com
```

Local preview:

```text
http://localhost:3000
```

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and database
- Recharts
- lucide-react

## Main Features

- Homepage link checker for resale and retail product links
- Server-side link reader for public product metadata, JSON-LD, OpenGraph/Twitter cards, and visible server-rendered prices
- Full listing analyzer with strict deal score, market position label, risk level, confidence level, and suggested offer guidance
- Red flag detection, trust signals, and seller questions
- Retail-versus-resale link handling
- Saved verdicts from analyzed links
- Local saved-item fallback when logged out
- Supabase account sync when configured
- Customer-facing About Us page

## Current Product Direction

BuyWise is link-first. The old starter product catalog is not part of the main user flow anymore. Search and old product guide URLs redirect to the analyzer.

The analyzer does not force links into saved product guides. If BuyWise cannot verify a market price for the exact item, it says that clearly and keeps the score cautious.

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the database schema in Supabase SQL Editor:

```sql
-- See supabase/schema.sql
```

Start locally:

```bash
npm run dev
```

## Checks

```bash
npm run typecheck
npm run lint
```

## Important Files

- `app/page.tsx` - Homepage
- `components/HomeListingPrompt.tsx` - Homepage link checker
- `app/submit/page.tsx` - Analyzer route
- `components/ListingAnalyzerForm.tsx` - Analyzer form and auto-analysis behavior
- `components/DealScoreCard.tsx` - Verdict/result UI
- `app/api/extract-link/route.ts` - Server-side link reader
- `lib/dealQuality.ts` - Strict scoring, risk, confidence, offer, and breakdown logic
- `lib/linkAnalysis.ts` - Source and link-type inference
- `lib/priceText.ts` - Manual price parsing from pasted details
- `components/SavedItemsClient.tsx` - Saved items and account sync
- `components/AuthForm.tsx` - Login/signup form
- `supabase/schema.sql` - Database schema

## Account Sync

Supabase is used for accounts, profiles, saved items, and listing check history. If Supabase environment variables are missing, the app still works locally with device-only saved items.

For production accounts:

1. Run `supabase/schema.sql` in the Supabase SQL editor.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel environment variables.
3. Redeploy the Vercel site.
4. Test signup, login, saving, status updates, and deletion.

## Link Reading

The link reader works with public pages that expose readable HTML metadata, JSON-LD, OpenGraph/Twitter cards, embedded structured data, or visible server-rendered price text. It does not use a headless browser, bypass CAPTCHAs, scrape private pages, or invent prices.

Supported sources are best-effort, not guaranteed. Amazon, eBay, Craigslist, Apple, Best Buy, Walmart, Target, B&H, StockX, and GOAT can work when the public page exposes enough readable data. Some pages block automated requests, hide prices behind scripts, show financing numbers, or expose unrelated prices. In those cases, BuyWise asks the user to confirm the missing product or price before scoring.

Price extraction now includes a confidence score and source explanation. Low-confidence prices, tiny unrelated prices, shipping costs, financing/monthly payment text, coupons, crossed-out prices, and unrelated suggested-product prices are not allowed to drive the final score.

BuyWise no longer maps unclear links to saved product guides. It scores from extracted and user-confirmed link details.

Facebook Marketplace is not fetched. Users should paste the listing title, price, and description.

## Current Limitations

- BuyWise does not yet pull full live market comps from every marketplace.
- BuyWise does not yet reliably find better live retail or resale alternatives.
- Universal link extraction is unrealistic because many retailers and marketplaces block or hide page data.
- If extraction confidence or price confidence is low, the app should ask for confirmation instead of pretending to know.
- Screenshot upload and browser-extension support are future candidates, especially for Facebook Marketplace and blocked pages.
