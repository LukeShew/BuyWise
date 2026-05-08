import Link from "next/link";
import { Database, FileText, PlugZap, TrendingUp } from "lucide-react";
import { mockProducts, supportedCategories } from "@/data/mockProducts";
import { formatCurrency } from "@/lib/format";

export default function AdminPage() {
  const totalMsrp = mockProducts.reduce((sum, product) => sum + product.msrp, 0);
  const totalFair = mockProducts.reduce((sum, product) => sum + product.fairPrice, 0);

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold text-mint">Admin</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Mock data management</h1>
        <p className="mt-3 leading-7 text-stone-600">
          Review the seeded MVP products, category coverage, and marketplace service architecture.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <Database className="h-6 w-6 text-mint" aria-hidden />
          <p className="mt-4 text-sm text-stone-500">Products</p>
          <p className="mt-1 text-3xl font-black text-ink">{mockProducts.length}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <FileText className="h-6 w-6 text-mint" aria-hidden />
          <p className="mt-4 text-sm text-stone-500">MSRP tracked</p>
          <p className="mt-1 text-3xl font-black text-ink">{formatCurrency(totalMsrp)}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <PlugZap className="h-6 w-6 text-mint" aria-hidden />
          <p className="mt-4 text-sm text-stone-500">Fair market value</p>
          <p className="mt-1 text-3xl font-black text-ink">{formatCurrency(totalFair)}</p>
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-4">
        {supportedCategories.map((category) => {
          const products = mockProducts.filter((product) => product.category === category);
          return (
            <div key={category} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-ink">{category}</h2>
              <p className="mt-2 text-sm text-stone-600">{products.length} mock products</p>
              <ul className="mt-4 space-y-2">
                {products.map((product) => (
                  <li key={product.id}>
                    <Link href={`/products/${product.id}`} className="text-sm font-semibold text-stone-700 hover:text-mint">
                      {product.brand} {product.model}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section className="mt-8 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-mint">Integration-ready services</p>
            <h2 className="mt-1 text-2xl font-bold text-ink">Mock services to replace later</h2>
          </div>
          <Link href="/" className="focus-ring rounded-lg bg-ink px-4 py-2 font-semibold text-white hover:bg-stone-800">
            Test analyzer
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            "services/ebayService.ts",
            "services/craigslistService.ts",
            "services/facebookMarketplaceService.ts",
            "services/priceAnalysisService.ts"
          ].map((service) => (
            <div key={service} className="rounded-lg bg-stone-50 p-4">
              <p className="font-mono text-sm font-semibold text-ink">{service}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Returns typed mock marketplace listings behind a replaceable async interface.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-stone-200 bg-ink p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <TrendingUp className="mt-1 h-6 w-6 text-mint" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-mint">Customer-facing page</p>
              <h2 className="mt-1 text-2xl font-bold">Explain why buyers should use BuyWise</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-200">
                The public page summarizes what BuyWise does, who it helps, and how pasted-link checks work.
              </p>
            </div>
          </div>
          <Link
            href="/about"
            className="focus-ring inline-flex justify-center rounded-lg bg-white px-4 py-2 font-semibold text-ink hover:bg-stone-100"
          >
            View page
          </Link>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 p-5">
          <p className="text-sm font-semibold text-mint">Products table</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Current mock catalog</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">MSRP</th>
                <th className="px-4 py-3 font-semibold">Used avg</th>
                <th className="px-4 py-3 font-semibold">Fair</th>
                <th className="px-4 py-3 font-semibold">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {mockProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 font-semibold text-ink">
                    <Link href={`/products/${product.id}`} className="hover:text-mint">
                      {product.brand} {product.model}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{product.category}</td>
                  <td className="px-4 py-3 text-stone-600">{formatCurrency(product.msrp)}</td>
                  <td className="px-4 py-3 text-stone-600">{formatCurrency(product.usedAvg)}</td>
                  <td className="px-4 py-3 text-stone-600">{formatCurrency(product.fairPrice)}</td>
                  <td className="px-4 py-3 text-stone-600">{product.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
