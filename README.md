# BuyWise

BuyWise helps shoppers check a product link before they buy. Paste a resale listing or retail product page, and BuyWise gives a plain-English verdict on whether that link looks worth buying from, what risks to verify, what price to offer or target, and whether there are better used or retail options in the current BuyWise price guides.

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
- Server-side link reader for public product metadata and prices
- Full listing analyzer with verdicts, deal score, risk level, confidence, and suggested offer guidance
- Red flag detection, trust signals, seller questions, and buyer checklist
- Retail-versus-resale comparison logic
- Better retail and resale alternatives when current BuyWise price guides have a stronger option
- Searchable BuyWise price guides
- Product insight pages
- Bookmark/save buttons on product cards
- Saved verdicts from analyzed links
- Local saved-item fallback when logged out
- Supabase account sync when configured
- Customer-facing About Us page

## Current Price Guides

BuyWise currently has 20 starter price guides:

- Cameras: Sony A6400, Canon EOS R10, Fujifilm X-T30 II, Sony A7 III, Canon M50 Mark II
- Laptops: MacBook Air M1, MacBook Air M2, Dell XPS 13, Lenovo ThinkPad X1 Carbon, Microsoft Surface Laptop 5
- Bikes: Trek Marlin 5, Specialized Rockhopper, Giant Talon, Cannondale Quick, Trek FX 3
- Monitors: Dell UltraSharp U2720Q, LG 27GL850, ASUS ProArt PA278QV, Samsung Odyssey G5, BenQ PD2700U

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
- `lib/dealQuality.ts` - Scoring, risk, confidence, offer, and next-step logic
- `lib/linkAnalysis.ts` - Source inference and alternatives
- `lib/productMatch.ts` - Product matching against current price guides
- `data/mockProducts.ts` - Current internal product data
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

The link reader works with public pages that expose readable HTML metadata, JSON-LD, or visible price text. Some websites block automated reading, require login, or hide prices. In those cases, BuyWise asks the user for the missing details.

Facebook Marketplace is not fetched. Users should paste the listing title, price, and description.
