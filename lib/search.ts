import { mockProducts } from "@/data/mockProducts";
import type { Product, ProductCategory } from "@/types";

export interface ProductSearchParams {
  query?: string;
  category?: ProductCategory | "All";
  minYear?: number;
  maxYear?: number;
}

function searchableText(product: Product) {
  return [
    product.category,
    product.brand,
    product.model,
    product.year.toString(),
    `${product.brand} ${product.model}`,
    ...product.commonIssues.map((issue) => issue.issue)
  ]
    .join(" ")
    .toLowerCase();
}

export function searchProducts(params: ProductSearchParams) {
  const query = params.query?.trim().toLowerCase();

  return mockProducts.filter((product) => {
    const matchesQuery = !query || searchableText(product).includes(query);
    const matchesCategory =
      !params.category || params.category === "All" || product.category === params.category;
    const matchesMinYear = !params.minYear || product.year >= params.minYear;
    const matchesMaxYear = !params.maxYear || product.year <= params.maxYear;

    return matchesQuery && matchesCategory && matchesMinYear && matchesMaxYear;
  });
}

export function getSearchSuggestions() {
  return ["Sony A6400", "MacBook Air M2", "Trek Marlin 5", "Dell Ultrasharp 27"];
}
