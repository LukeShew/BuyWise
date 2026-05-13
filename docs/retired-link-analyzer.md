# Retired Link Analyzer

BuyWise is now photo-only. The old link analyzer was removed from the active app so the product can focus on uploaded screenshots and product photos.

Last known commit before this removal:

```text
0f5d10b Restore live offer search
```

Removed active pieces:

- `app/api/extract-link/route.ts`
- `app/api/search-offers/route.ts`
- `components/HomeListingPrompt.tsx`
- `components/ListingAnalyzerForm.tsx`
- `components/LiveOfferCard.tsx`
- `components/LiveOfferSearch.tsx`
- `lib/linkAnalysis.ts`
- `lib/listingDraft.ts`
- public link-input copy on the homepage and analyzer page

What it did:

- accepted product/listing links
- tried official provider lookup when configured
- fell back to public metadata and server-rendered HTML parsing
- filled analyzer fields from extracted link data
- showed live-offer Search results when provider keys existed

Why it was retired:

- many major sites hide or block reliable pricing
- the product direction is now photo-first
- showing link inputs made the app feel incomplete when extraction failed
- uploaded screenshots are a cleaner MVP path for real marketplace and retail pages

How to revisit later:

1. Branch from or inspect commit `0f5d10b`.
2. Restore only the useful provider/metadata extraction pieces.
3. Keep link analysis secondary to photo analysis unless the product direction changes.
4. Do not bring back fake/preset product cards.
