import type { Dict } from "@/i18n";
import type { Product } from "@/lib/types";

export function StockBadge({ p, d }: { p: Pick<Product, "stock_quantity" | "low_stock_threshold" | "archived">; d: Dict }) {
  if (p.archived) return <span className="badge bg-ink-100 text-ink-600">{d.products.archived}</span>;
  if (p.stock_quantity <= 0) return <span className="badge bg-red-50 text-red-700">{d.products.out}</span>;
  if (p.stock_quantity <= p.low_stock_threshold) return <span className="badge bg-amber-50 text-amber-800">{d.products.low}</span>;
  return <span className="badge bg-emerald-50 text-emerald-700">{d.products.ok}</span>;
}

