import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuyWise",
  description: "Upload product photos and see whether the deal looks worth buying, risky, or overpriced."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
