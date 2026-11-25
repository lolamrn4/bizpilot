import Link from "next/link";
import { getAppContext, can } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { fmt } from "@/i18n";
import { resolvePeriod } from "@/lib/periods";
import { formatMoney, formatNumber } from "@/lib/money";
import { errorMessage } from "@/lib/errors";
import { PeriodFilter } from "@/components/PeriodFilter";
import { RevenueExpenseChart } from "@/components/Charts";

type Summary = {
  currency: string; bucket: "day" | "month"; revenue: number; collected: number; expenses: number;
  estimated_result: number; sales_count: number; pending_total: number; pending_count: number;
  stock_value: number; low_stock: number; out_of_stock: number;
  series: { bucket: string; revenue: number; expenses: number; collected: number }[];
  top_products: { name: string; quantity: number; revenue: number }[];
  expenses_by_category: { code: string | null; name: string; amount: number }[];
  stock_alerts: { id: string; name: string; stock_quantity: number; low_stock_threshold: number }[];
};

function Stat({ label, value, hint, tone = "default", href }: { label: string; value: string; hint?: string; tone?: "default" | "brand" | "good" | "bad" | "warn"; href?: string }) {
  const colors = { default: "text-ink-900", brand: "text-brand-700", good: "text-emerald-700", bad: "text-red-700", warn: "text-amber-700" };
  const body = (
    <div className="card h-full p-4">
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className={`mt-1 truncate text-lg font-bold sm:text-xl ${colors[tone]}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] leading-snug text-ink-400">{hint}</p>}
    </div>
  );
  return href ? <Link href={href} className="block transition hover:-translate-y-0.5">{body}</Link> : body;
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { business, supabase, profile, entitlements } = await getAppContext();
  const { d, lang } = await getDict();
  const sp = await searchParams;
  const allPeriods = can(entitlements, "all_periods");
  const p = resolvePeriod(business.timezone, sp.period, sp.from, sp.to);
  const { data, error } = await supabase.rpc("dashboard_summary", { p_business: business.id, p_from: p.from, p_to: p.to });
  const s = data as Summary | null;
  const m = (v: number) => formatMoney(v, business.currency, lang);
  const firstName = (profile.full_name || "").split(" ")[0];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h1">{firstName ? fmt(d.dashboard.hello, { name: firstName }) : d.nav.dashboard}</h1>
        <p className="text-sm text-ink-500">{business.name}</p>
      </div>
      <PeriodFilter period={p.period} from={p.from} to={p.to} allPeriods={allPeriods} />
      {error && <p className="alert-error">{errorMessage(error, d)}</p>}
      {s && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={d.dashboard.revenue} value={m(s.revenue)} hint={d.dashboard.revenueHint} tone="brand" />
            <Stat label={d.dashboard.collected} value={m(s.collected)} hint={d.dashboard.collectedHint} />
            <Stat label={d.dashboard.expenses} value={m(s.expenses)} />
            <Stat label={d.dashboard.result} value={m(s.estimated_result)} hint={d.dashboard.resultHint} tone={s.estimated_result >= 0 ? "good" : "bad"} />
            <Stat label={d.dashboard.pending} value={m(s.pending_total)} hint={fmt(d.dashboard.pendingHint, { n: s.pending_count })} tone={s.pending_total > 0 ? "warn" : "default"} href="/app/sales?status=unpaid" />
            <Stat label={d.dashboard.salesCount} value={formatNumber(s.sales_count, lang)} href="/app/sales" />
            <Stat label={d.dashboard.stockValue} value={m(s.stock_value)} hint={d.dashboard.stockValueHint} href="/app/products" />
            <Stat label={`${d.dashboard.lowStock} · ${d.dashboard.outOfStock}`} value={`${can(entitlements, "low_stock_alerts") ? s.low_stock : "—"} · ${s.out_of_stock}`} tone={s.out_of_stock > 0 ? "bad" : "default"} href="/app/products" />
          </div>
          <p className="text-xs text-ink-400">{d.dashboard.estimateNote}</p>

          {s.sales_count === 0 && s.expenses === 0 ? (
            <div className="card p-6 text-center text-sm text-ink-600">{d.dashboard.empty}</div>
          ) : (
            <div className="card p-4 sm:p-5">
              <h2 className="h2 mb-3">{d.dashboard.chartTitle}</h2>
              <RevenueExpenseChart data={s.series} currency={business.currency} bucket={s.bucket} />
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card p-4 sm:p-5">
              <h2 className="h2 mb-3">{d.dashboard.topProducts}</h2>
              {s.top_products.length === 0 ? <p className="text-sm text-ink-500">{d.common.noData}</p> : (
                <ul className="space-y-2.5">
                  {s.top_products.map((t) => (
                    <li key={t.name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{t.name} <span className="text-ink-400">× {formatNumber(t.quantity, lang)}</span></span>
                      <span className="font-semibold">{m(t.revenue)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card p-4 sm:p-5">
              <h2 className="h2 mb-3">{d.dashboard.byCategory}</h2>
              {s.expenses_by_category.length === 0 ? <p className="text-sm text-ink-500">{d.common.noData}</p> : (
                <ul className="space-y-2.5">
                  {s.expenses_by_category.map((c) => {
                    const pct = s.expenses > 0 ? (Number(c.amount) / Number(s.expenses)) * 100 : 0;
                    return (
                      <li key={(c.code ?? "") + c.name} className="text-sm">
                        <div className="flex justify-between gap-3"><span className="truncate">{c.code ? d.categories[c.code as keyof typeof d.categories] : c.name}</span><span className="font-semibold">{m(c.amount)}</span></div>
                        <div className="mt-1 h-1.5 rounded-full bg-ink-100"><div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${pct}%` }} /></div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="card p-4 sm:p-5">
              <h2 className="h2 mb-3">{d.dashboard.stockAlerts}</h2>
              {s.stock_alerts.length === 0 ? <p className="text-sm text-ink-500">{d.dashboard.noAlerts}</p> : (
                <ul className="space-y-2.5">
                  {s.stock_alerts
                    .filter((a) => a.stock_quantity <= 0 || can(entitlements, "low_stock_alerts"))
                    .map((a) => (
                      <li key={a.id}>
                        <Link href={`/app/products/${a.id}`} className="flex items-center justify-between gap-3 text-sm hover:underline">
                          <span className="truncate">{a.name}</span>
                          <span className={`badge ${a.stock_quantity <= 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                            {a.stock_quantity <= 0 ? d.products.out : `${formatNumber(a.stock_quantity, lang)} ${d.dashboard.left}`}
                          </span>
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
              {!can(entitlements, "low_stock_alerts") && <p className="mt-3 text-xs text-ink-500">{d.dashboard.lowStockLocked}</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
