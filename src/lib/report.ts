import type { Dict } from "@/i18n";
import { formatMoney, formatNumber, formatDate } from "@/lib/money";

export const SECTIONS = ["summary", "sales", "expenses", "stock", "pending"] as const;
export type Section = (typeof SECTIONS)[number];

type R = Record<string, unknown>;
export type ReportData = {
  summary: R & { revenue: number; collected: number; expenses: number; estimated_result: number; sales_count: number; pending_total: number; stock_value: number };
  sales: R[]; expenses: R[]; stock: R[]; pending: R[];
};

/** Transforme une section du rapport en tableau (en-têtes + lignes) — valeurs brutes pour le CSV, formatées pour le PDF/écran. */
export function sectionTable(section: Section, data: ReportData, d: Dict, lang: "fr" | "en", currency: string, pretty: boolean) {
  const money = (v: unknown, cur = currency) => (pretty ? formatMoney(Number(v), cur, lang) : String(v ?? 0));
  const num = (v: unknown) => (pretty ? formatNumber(Number(v), lang) : String(v ?? 0));
  const date = (v: unknown) => (pretty ? formatDate(String(v), lang) : String(v));
  const status = (s: unknown) => (s === "paid" ? d.sales.paid : s === "partial" ? d.sales.partial : d.sales.pending);
  const method = (m: unknown) => d.methods[m as keyof Dict["methods"]] ?? String(m);
  switch (section) {
    case "summary": {
      const s = data.summary;
      return {
        head: [d.reports.summary, d.common.amount],
        rows: [
          [d.dashboard.revenue, money(s.revenue)],
          [d.dashboard.collected, money(s.collected)],
          [d.dashboard.expenses, money(s.expenses)],
          [`${d.reports.profitability} (${d.dashboard.resultHint})`, money(s.estimated_result)],
          [d.dashboard.salesCount, num(s.sales_count)],
          [d.dashboard.pending, money(s.pending_total)],
          [d.dashboard.stockValue, money(s.stock_value)],
        ],
      };
    }
    case "sales":
      return {
        head: [d.common.date, d.sales.itemName, d.sales.quantity, d.sales.unitPrice, d.common.total, d.sales.paid, d.sales.remaining, d.sales.status, d.sales.customer, d.sales.paymentMethod],
        rows: data.sales.map((r) => [date(r.sale_date), String(r.item_name), num(r.quantity), money(r.unit_price, String(r.currency)), money(r.total, String(r.currency)), money(r.amount_paid, String(r.currency)), money(r.remaining, String(r.currency)), status(r.status), String(r.customer_name ?? ""), method(r.payment_method)]),
      };
    case "expenses":
      return {
        head: [d.common.date, d.expenses.name, d.expenses.category, d.common.amount, d.sales.paymentMethod],
        rows: data.expenses.map((r) => [date(r.expense_date), String(r.name), r.category_code ? d.categories[r.category_code as keyof Dict["categories"]] : String(r.category_name), money(r.amount, String(r.currency)), method(r.payment_method)]),
      };
    case "stock":
      return {
        head: [d.products.name, d.products.sku, d.products.category, d.products.stock, d.products.threshold, d.products.unitCost, d.products.salePrice, d.reports.stockValue],
        rows: data.stock.map((r) => [String(r.name), String(r.sku ?? ""), String(r.category ?? ""), num(r.stock_quantity), num(r.low_stock_threshold), money(r.unit_cost, String(r.currency)), money(r.sale_price, String(r.currency)), money(r.stock_value, String(r.currency))]),
      };
    case "pending":
      return {
        head: [d.common.date, d.sales.itemName, d.sales.customer, d.common.total, d.sales.paid, d.sales.remaining],
        rows: data.pending.map((r) => [date(r.sale_date), String(r.item_name), String(r.customer_name ?? ""), money(r.total, String(r.currency)), money(r.amount_paid, String(r.currency)), money(r.remaining, String(r.currency))]),
      };
  }
}

export const sectionTitle = (s: Section, d: Dict) =>
  ({ summary: d.reports.summary, sales: d.reports.sales, expenses: d.reports.expenses, stock: d.reports.stock, pending: d.reports.pending })[s];
