export const CURRENCIES = ["USD", "EUR", "GBP", "GNF", "XOF", "NGN"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const DECIMALS: Record<Currency, number> = { USD: 2, EUR: 2, GBP: 2, GNF: 0, XOF: 0, NGN: 2 };
export const isCurrency = (v: unknown): v is Currency => CURRENCIES.includes(v as Currency);

const locales = { fr: "fr-FR", en: "en-US" } as const;

/** Formate un montant dans SA devise. On ne convertit et n'additionne jamais deux devises. */
export function formatMoney(amount: number | string | null | undefined, currency: string, lang: "fr" | "en") {
  const n = Number(amount ?? 0);
  const dec = DECIMALS[currency as Currency] ?? 2;
  try {
    return new Intl.NumberFormat(locales[lang], {
      style: "currency",
      currency,
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    }).format(n);
  } catch {
    return `${n.toFixed(dec)} ${currency}`;
  }
}

export function formatNumber(n: number | string | null | undefined, lang: "fr" | "en", maxDec = 3) {
  return new Intl.NumberFormat(locales[lang], { maximumFractionDigits: maxDec }).format(Number(n ?? 0));
}

export function formatPercent(ratio: number, lang: "fr" | "en") {
  return new Intl.NumberFormat(locales[lang], { style: "percent", maximumFractionDigits: 1 }).format(ratio);
}

export function formatDate(iso: string, lang: "fr" | "en") {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat(locales[lang], { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** Lit un nombre saisi par l'utilisateur ("1 234,50" ou "1234.50"). */
export function parseAmount(v: FormDataEntryValue | null | undefined): number | null {
  if (v == null) return null;
  const s = String(v).replace(/[\s  ]/g, "").replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Calculs de prix déterministes (Smart Pricing de base). Marge ≠ majoration. */
export function pricing(unitCost: number, salePrice: number) {
  const profit = salePrice - unitCost;
  return {
    profit,
    margin: salePrice > 0 ? profit / salePrice : null, // bénéfice / prix de vente
    markup: unitCost > 0 ? profit / unitCost : null, // bénéfice / coût
    loss: salePrice < unitCost,
  };
}
