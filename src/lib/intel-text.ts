import { fmt, type Dict } from "@/i18n";
import { formatDate, formatMoney, formatNumber, formatPercent } from "@/lib/money";

/** Textes déterministes (traduits) construits uniquement à partir des chiffres calculés en base. */

export type Recommendation = {
  id: string; rule: string; priority: 1 | 2 | 3; period_from: string; period_to: string;
  metrics: Record<string, unknown>; status: "open" | "done" | "expired"; updated_at: string; done_at: string | null;
};

type L = "fr" | "en";
const n = (v: unknown) => Number(v ?? 0);

export function renderRecommendation(rec: Recommendation, d: Dict, lang: L, currency: string) {
  const m = rec.metrics;
  const money = (v: unknown) => formatMoney(n(v), currency, lang);
  const pct = (v: unknown) => formatPercent(n(v), lang);           // ratio -> %
  const pctPts = (v: unknown) => formatPercent(n(v) / 100, lang);  // déjà en %
  const num = (v: unknown) => formatNumber(n(v), lang, 1);
  const cat = m.top_category_code ? d.categories[m.top_category_code as keyof Dict["categories"]] : String(m.top_category_name ?? "");
  const vars: Record<string, string> = {
    product: String(m.product ?? ""),
    pct: pctPts(Math.abs(n(m.change_pct))),
    revPct: m.revenue_change_pct == null ? "—" : pctPts(m.revenue_change_pct),
    current: money(m.current), previous: money(m.previous),
    category: cat, increase: money(m.top_category_increase),
    units: num(m.loss_units ?? m.units), loss: money(m.loss_amount), cost: money(m.unit_cost),
    suggested: money(m.suggested_price), target: pct(m.target_margin),
    margin: pct(m.actual_margin ?? m.margin), min: pct(m.min_margin), avg: money(m.avg_price),
    stock: num(m.stock), days: num(m.cover_days ?? m.oldest_days ?? m.days_without_sale), daily: num(m.daily_units),
    qty: num(m.reorder_qty), count: num(m.count), amount: money(m.amount), value: money(m.stock_value),
    profit: money(m.profit), uplift: num(m.uplift_pct), benefit: money(m.benefit),
  };
  const t = d.coach.rules[rec.rule as keyof Dict["coach"]["rules"]];
  if (!t) return null;
  return {
    title: fmt(t.title, vars), problem: fmt(t.problem, vars), figure: fmt(t.figure, vars),
    explanation: t.explanation, action: fmt(t.action, vars), benefit: fmt(t.benefit, vars),
    period: fmt(d.coach.period, { from: formatDate(rec.period_from, lang), to: formatDate(rec.period_to, lang) }),
  };
}

export type ForecastPayload = {
  status: "ok" | "insufficient_data"; currency: string; horizon_days: number; generated_on: string;
  period?: { from: string; to: string };
  data_used: { days: number; from: string; to: string; recent_days?: number; sales: number; expenses: number; payments: number };
  requirements?: { min_days: number; min_sales: number };
  confidence?: "high" | "medium" | "low";
  variability?: { revenue: number; expenses: number; collected: number };
  revenue?: Band; collected?: Band; expenses?: Band;
  pending_receivables?: number;
  cash?: { opening_set: boolean; current_estimate: number | null; projected_end: number | null; net_daily: number; net_flow: number; days_until_zero: number | null; risk: "high" | "medium" | "low" };
  restock?: { id: string; name: string; stock: number; threshold: number; daily_units: number; cover_days: number; suggested_qty: number }[];
  hypotheses?: string[]; limits?: string[];
};
type Band = { daily: number; expected: number; low: number; high: number };

export function hypothesisText(key: string, f: ForecastPayload, d: Dict) {
  const k = `h_${key}` as keyof Dict["forecast"];
  return fmt(String(d.forecast[k] ?? key), { n: f.data_used.recent_days ?? f.data_used.days, currency: f.currency });
}
export function limitText(key: string, d: Dict) {
  return String(d.forecast[`l_${key}` as keyof Dict["forecast"]] ?? key);
}

/** Faits de la prévision, en phrases simples, pour l'affichage standard et pour l'IA. */
export function forecastFacts(f: ForecastPayload, d: Dict, lang: L): string[] {
  const money = (v: unknown) => formatMoney(n(v), f.currency, lang);
  if (f.status !== "ok") {
    return [d.forecast.insufficientTitle, fmt(d.forecast.insufficientText, {
      days: f.requirements?.min_days ?? 14, sales: f.requirements?.min_sales ?? 10, haveDays: f.data_used.days, haveSales: f.data_used.sales })];
  }
  const out = [
    fmt(d.forecast.period, { from: formatDate(f.period!.from, lang), to: formatDate(f.period!.to, lang) }),
    `${d.forecast.confidence} : ${d.forecast[`conf_${f.confidence!}` as const]}`,
    `${d.forecast.revenue} : ${money(f.revenue!.expected)} (${fmt(d.forecast.range, { low: money(f.revenue!.low), high: money(f.revenue!.high) })})`,
    `${d.forecast.collected} : ${money(f.collected!.expected)}`,
    `${d.forecast.expenses} : ${money(f.expenses!.expected)} (${fmt(d.forecast.range, { low: money(f.expenses!.low), high: money(f.expenses!.high) })})`,
  ];
  const c = f.cash!;
  if (c.opening_set) {
    out.push(`${d.forecast.cashCurrent} : ${money(c.current_estimate)}`, `${d.forecast.cashEnd} : ${money(c.projected_end)}`);
    if (c.days_until_zero != null) out.push(fmt(d.forecast.cashZero, { n: c.days_until_zero }));
  } else {
    out.push(`${d.forecast.cashNet} : ${money(c.net_flow)}`);
  }
  out.push(`${d.forecast.risk} : ${d.forecast[`risk_${c.risk}` as const]}`);
  if (n(f.pending_receivables) > 0) out.push(fmt(d.forecast.pending, { v: money(f.pending_receivables) }));
  for (const r of f.restock ?? []) {
    out.push(`${d.forecast.restockTitle} – ${r.name} : ${d.forecast.restockCols.qty} ${formatNumber(r.suggested_qty, lang)} (${d.forecast.restockCols.cover} ${formatNumber(r.cover_days, lang, 1)})`);
  }
  return out;
}
