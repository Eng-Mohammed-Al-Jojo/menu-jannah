export interface PriceOption {
  price: number;
  label: string;
}

const arabicOrdinals = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس"];

export function getPriceOptions(item: { price?: unknown; priceLabelsAr?: unknown; priceNamesAr?: unknown }): PriceOption[] {
  const prices = String(item.price ?? "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);

  const rawLabels = item.priceLabelsAr ?? item.priceNamesAr;
  const labels = typeof rawLabels === "string"
    ? rawLabels.split(",").map((label) => label.trim()).filter(Boolean)
    : [];

  return prices.map((price, index) => ({
    price,
    label: labels[index] || `الخيار ${arabicOrdinals[index] || index + 1}`,
  }));
}

export function formatPriceSummary(options: PriceOption[]): string {
  if (!options.length) return "";
  if (options.length === 1) return `${options[0].price} ₪`;
  const values = options.map((option) => option.price);
  return `${Math.min(...values)}–${Math.max(...values)} ₪`;
}
