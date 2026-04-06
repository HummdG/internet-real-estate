export type SupportedCurrency = "USD" | "GBP";

export function detectCurrency(): SupportedCurrency {
  if (typeof navigator === "undefined") return "USD";
  const locale = navigator.language || "en-US";
  // GBP for UK locales
  if (locale.startsWith("en-GB") || locale.startsWith("cy")) return "GBP";
  return "USD";
}

export function formatPrice(minorUnit: number, currency: SupportedCurrency): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(minorUnit / 100);
}

export function pixelPrice(pixelCount: number, currency: SupportedCurrency): number {
  // $1 or £1 per pixel = 100 minor units per pixel
  return pixelCount * 100;
}

export function currencySymbol(currency: SupportedCurrency): string {
  return currency === "GBP" ? "£" : "$";
}
