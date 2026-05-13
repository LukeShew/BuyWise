import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>BuyWise helps buyers check product links before they pay.</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/" prefetch={false} className="font-semibold hover:text-ink">
            Analyze Listing
          </Link>
          <Link href="/saved" prefetch={false} className="font-semibold hover:text-ink">
            Saved
          </Link>
          <Link href="/about" prefetch={false} className="font-semibold hover:text-ink">
            About Us
          </Link>
          <Link href="/auth" prefetch={false} className="font-semibold hover:text-ink">
            Account
          </Link>
        </div>
      </div>
    </footer>
  );
}
