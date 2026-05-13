# BuyWise

BuyWise is a photo-first deal checker. Users upload screenshots or product photos from a marketplace listing, retail product page, checkout page, or product sale post. BuyWise analyzes the images, asks for a confirmed price when needed, scores the deal, and can publish a safe extracted product card to Search for 24 hours.

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
- Supabase Auth, database, and private storage
- OpenAI vision analysis
- lucide-react

## Main Features

- Photo-only analyzer with drag/drop, camera import, and file picker
- Multi-photo upload for one product or listing
- OpenAI vision analysis with structured JSON output
- Rejection flow for unrelated, non-product, unsafe, or inappropriate uploads
- Manual price confirmation, where a typed price is treated as 100% price confidence
- Strict deal score, market position label, confidence level, suggested offer/buy range, subscores, red flags, pros/cons, and alternatives
- Search page showing approved extracted product cards for 24 hours
- Private raw uploaded images; Search does not expose original screenshots
- Supabase account creation, login, saved verdicts, and saved-item syncing
- Cleanup route for expired Search feed rows and private storage objects

## Current Product Direction

BuyWise is now photo-only. Link analysis was removed from the active app because many major sites block or hide reliable pricing, which made link extraction feel inconsistent. The retired link direction is documented in `docs/retired-link-analyzer.md`.

The current analyzer is honest about uncertainty. If the uploaded photo does not clearly show a product for sale, BuyWise rejects it. If the price is missing, BuyWise asks for the price before scoring. If market comparisons are not available from configured providers, the verdict says that instead of inventing a benchmark.

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
OPENAI_VISION_MODEL=gpt-4.1-mini
CRON_SECRET=your_cleanup_secret

# Optional market comparison providers
EBAY_CLIENT_ID=optional_ebay_client_id
EBAY_CLIENT_SECRET=optional_ebay_client_secret
EBAY_MARKETPLACE_ID=EBAY_US
BEST_BUY_API_KEY=optional_best_buy_api_key
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

- `app/page.tsx` - Homepage with photo analyzer
- `app/submit/page.tsx` - Analyzer page
- `components/PhotoAnalyzerForm.tsx` - Upload, preview, drag/drop, and analysis flow
- `app/api/analyze-photos/route.ts` - Server-side photo analysis and optional Search publishing
- `components/DealScoreCard.tsx` - Verdict/result UI
- `app/search/page.tsx` - Public temporary product feed page
- `components/PhotoFeedSearch.tsx` - Search feed UI
- `app/api/photo-feed/route.ts` - Approved non-expired Search feed API
- `app/api/cleanup-photo-feed/route.ts` - Expired row/storage cleanup API
- `services/marketCompsService.ts` - Optional provider-backed market comparison service
- `lib/dealQuality.ts` - Deal scoring, risk, confidence, offer, and breakdown logic
- `components/SavedItemsClient.tsx` - Saved items and account sync
- `components/AuthForm.tsx` - Login/signup form
- `supabase/schema.sql` - Database, RLS, and storage schema
- `docs/retired-link-analyzer.md` - Notes for restoring the old link direction later

## Account Sync

Supabase is used for accounts, profiles, saved items, listing check history, photo analysis rows, and private uploaded-image storage. If Supabase environment variables are missing, users can still analyze photos locally, but uploads will not publish to Search and account syncing will not work.

For production accounts and photo publishing:

1. Run `supabase/schema.sql` in Supabase SQL Editor.
2. Add Supabase, OpenAI, and cleanup environment variables to Vercel.
3. Redeploy the Vercel site.
4. Test signup, login, photo analysis, saving verdicts, Search feed publishing, and cleanup.

## Photo Analysis

The analyzer sends uploaded images to OpenAI vision through a server route. The route asks for structured JSON and does not trust missing or unclear details. It rejects:

- unrelated photos
- images that do not show a product or sale flow
- unsafe or inappropriate products
- uploads without enough product identity to analyze

Raw uploaded images are stored privately in Supabase Storage only when service-role storage is configured. Search returns approved extracted product cards, not original screenshots.

## Search Feed

Search is a temporary feed of approved photo-analyzed product cards. It only returns rows where:

- `visible_in_search = true`
- `moderation_status = 'approved'`
- `expires_at > now()`

Rows expire after 24 hours. The cleanup route hides expired rows and removes private storage objects.

## Market Checks

BuyWise can search configured providers for comparable products after the photo analysis extracts a product name. Current optional providers:

- eBay Browse API with `EBAY_CLIENT_ID` and `EBAY_CLIENT_SECRET`
- Best Buy Product API with `BEST_BUY_API_KEY`

If provider credentials are missing or too few comparable prices are found, BuyWise keeps the market check unverified and lowers confidence. It does not fake live market prices.

## Current Limitations

- OpenAI vision credentials are required for the photo analyzer.
- Market comparison quality depends on configured provider credentials and comparable search results.
- Raw screenshots are not publicly shown because they may contain personal or seller information.
- Search feed thumbnails should only be added later after safe cropping/redaction is implemented.
- Link analysis is retired from the active app. It can be revisited later from the archived notes.
