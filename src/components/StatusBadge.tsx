import type { Dict } from "@/i18n";

export function StatusBadge({ status, d }: { status: string; d: Dict }) {
  const cls = status === "paid" ? "bg-emerald-50 text-emerald-700" : status === "partial" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700";
  const label = status === "paid" ? d.sales.paid : status === "partial" ? d.sales.partial : d.sales.pending;
  return <span className={`badge ${cls}`}>{label}</span>;
}
