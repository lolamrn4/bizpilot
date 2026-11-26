/** Grille tarifaire validée (prix mensuels). Le GNF est la référence ; Paddle facture en USD, EUR ou GBP. */
export const PAID_PLANS = ["standard", "premium", "business"] as const;
export type PaidPlan = (typeof PAID_PLANS)[number];

export const PRICE_GRID: Record<PaidPlan, Record<string, number | null>> = {
  standard: { GNF: 50000, USD: 5.99, EUR: 4.99, GBP: 4.49, XOF: 3500, NGN: null },
  premium: { GNF: 100000, USD: 9.99, EUR: 9.99, GBP: 8.49, XOF: 6500, NGN: null },
  business: { GNF: 190000, USD: 21.99, EUR: 18.99, GBP: 16.49, XOF: 12500, NGN: null },
};

/** Devises réellement facturables par Paddle pour nos formules. */
export const CHARGE_CURRENCIES = ["USD", "EUR", "GBP"] as const;

/** Devise de facturation probable selon la devise de l'entreprise (indicatif : Paddle décide selon le pays du client). */
export function chargeCurrencyFor(businessCurrency: string): "USD" | "EUR" | "GBP" {
  return businessCurrency === "EUR" ? "EUR" : businessCurrency === "GBP" ? "GBP" : "USD";
}

// Pays de la zone euro (prix EUR) — les autres pays paient en USD, sauf le Royaume-Uni (GBP).
export const EURO_COUNTRIES = ["AT", "BE", "BG", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES", "MC", "SM", "AD"];
