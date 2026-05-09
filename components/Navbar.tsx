import Link from "next/link";
import { AuthStatus } from "@/components/AuthStatus";

const links = [
  { href: "/search", label: "Search" },
  { href: "/", label: "Analyze Listing" },
  { href: "/saved", label: "Saved" }
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-paper/90 backdrop-blur">
      <nav className="relative mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          prefetch={false}
          className="focus-ring z-10 flex items-center gap-2 rounded-lg font-bold text-ink"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white shadow-sm">
            <span className="text-lg font-black leading-none">B</span>
          </span>
          <span className="hidden text-xl font-black tracking-normal sm:inline">BuyWise</span>
        </Link>
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-white hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="z-10 ml-auto flex items-center gap-1">
          <Link
            href="/about"
            prefetch={false}
            className="focus-ring hidden rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-white hover:text-ink sm:inline-flex"
          >
            About Us
          </Link>
          <AuthStatus />
        </div>
      </nav>
    </header>
  );
}
