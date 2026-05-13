export function parseConfirmedPriceFromText(text: string) {
  const normalized = text.replace(/,/g, " ");
  const patterns = [
    /(?:price|asking|listed|sale|deal|shown|cost)\D{0,24}\$?\s*([1-9][0-9]{1,5}(?:\.[0-9]{1,2})?)/i,
    /\$\s*([1-9][0-9]{1,5}(?:\.[0-9]{1,2})?)/
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match?.[1]) {
      continue;
    }

    const price = Number.parseFloat(match[1]);
    if (Number.isFinite(price) && price >= 10 && price <= 100_000) {
      return price;
    }
  }

  return null;
}
