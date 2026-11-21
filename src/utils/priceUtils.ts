export interface PriceOption {
  price: number;
  label: string;
  originalPrice?: number;
}

export interface ItemVariant {
  id?: string;
  name: string;
  price: number;
  priceTw?: number;
}

const arabicOrdinals = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس"];

export function getPriceOptions(item: { price?: unknown; priceLabelsAr?: unknown; priceNamesAr?: unknown; variants?: unknown }): PriceOption[] {
  if (Array.isArray(item.variants) && item.variants.length > 0) {
    const variants = item.variants.map((variant: any, index) => ({
      price: Number(variant.price),
      label: String(variant.name || `الخيار ${index + 1}`),
      originalPrice: Number(variant.originalPrice) > Number(variant.price) ? Number(variant.originalPrice) : undefined,
    })).filter((option) => Number.isFinite(option.price) && option.price > 0);
    if (variants.length > 0) return variants;
  }
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
  return `يبدأ من ${Math.min(...values)} ₪`;
}
