import type { Product } from "@/types";

export function buildDepreciationData(product: Product) {
  const currentYear = new Date().getFullYear();
  const totalYears = Math.max(1, currentYear - product.year);
  const points = Array.from({ length: totalYears + 1 }, (_, index) => {
    const year = product.year + index;
    const progress = index / totalYears;
    const value = Math.round(product.msrp - (product.msrp - product.usedAvg) * Math.pow(progress, 0.72));

    return {
      year,
      value: index === totalYears ? product.usedAvg : value
    };
  });

  return points;
}
