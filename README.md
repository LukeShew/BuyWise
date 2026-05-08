# BuyWise

An MVP web app that helps buyers decide whether a used item is a good deal before messaging the seller.

Users can search supported products, review used-market pricing, see depreciation, inspect common problems, check scam warnings, analyze a live listing, and save items they are considering.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase auth and database
- Recharts for depreciation charts
- Mock marketplace services structured for real API integrations later

## Features

- Landing page with search and example products
- Search/results page with category and year filtering
- Product insight pages for 20 mock products
- Listing analyzer with deal score, recommendation, risk level, and suggested offer range
- Listing-specific red flag detection, trust signals, confidence score, and negotiation tip
- Saved items page with status tracking
- Supabase login/signup page
- Internal admin/mock data page
- Customer-facing About Us page
- Database schema in `supabase/schema.sql`

## Mock Catalog

The MVP includes 20 products:

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

Open:

```text
http://localhost:3000
```

## Database Schema

Tables:

- `profiles`
- `products`
- `product_issues`
- `buying_checklist_items`
- `seller_questions`
- `saved_items`
- `listing_checks`

The app currently reads product data from `data/mockProducts.ts`. The schema is ready for moving products and related rows into Supabase.

## Marketplace API Architecture

Mock services live in:

- `services/ebayService.ts`
- `services/craigslistService.ts`
- `services/facebookMarketplaceService.ts`
- `services/priceAnalysisService.ts`

Each service returns typed `MarketplaceListing` objects. To add real APIs later:

1. Keep the same return type.
2. Add provider credentials to server-only environment variables.
3. Move API calls into server routes or server actions.
4. Normalize source results into `MarketplaceListing`.
5. Update `priceAnalysisService.ts` to blend completed sales, active listings, and local-market signals.

Do not scrape Facebook Marketplace. Use an approved API, user-submitted listings, or mock/local data.

## Deal Scoring Logic

Core calculation lives in `lib/dealQuality.ts`.

Inputs:

- asking price
- fair price
- used low/high
- reliability score
- scam risk score
- condition

Outputs:

- deal score from 0-100
- recommendation label
- explanation
- suggested offer range
- risk level
- confidence score
- detected red flags and trust signals
- negotiation tip and next steps

## Known Limitations

- Market prices are mock estimates.
- Supabase product tables are defined but not seeded by the app yet.
- Saved items sync to Supabase only when env vars and auth are configured; otherwise they use browser local storage.
- Listing checks are calculated client-side in the MVP.
- No real marketplace API calls are included.
