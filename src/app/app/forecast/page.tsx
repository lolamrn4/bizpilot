import Link from "next/link";
import { requireManager, can } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { fmt } from "@/i18n";
import { formatDate, formatMoney, formatNumber, formatPercent } from "@/lib/money";
import { LockNote } from "@/components/forms";
import { AiExplain } from "@/components/AiExplain";
import { aiEnabled } from "@/lib/ai";
import { hypothesisText, limitText, type ForecastPayload } from "@/lib/intel-text";
import { ForecastRunForm } from "../IntelForms";

const HORIZONS = [7, 30, 60, 90];

export default async function ForecastPage({ searchParams }: { searchParams: Promise<{ h?: string }> }) {
  const { supabase, business, entitlements } = await requireManager();
  const { d, lang } = await getDict();
  const sp = await searchParams;
  const h = HORIZONS.includes(Number(sp.h)) ? Number(sp.h) : 30;
  const allowed = can(entitlements, "forecast");
  const { data: rows } = allowed
    ? await supabase.from("forecasts").select("id, horizon_days, payload, created_at").eq("business_id", business.id).eq("horizon_days", h).order("created_at", { ascending: false }).limit(6)
    : { data: [] };
  const f = rows?.[0]?.payload as ForecastPayload | undefined;
  const m = (v: number | null | undefined) => (v == null ? "—" : formatMoney(v, business.currency, lang));
  const confCls = { high: "bg-emerald-50 text-emerald-700", medium: "bg-amber-50 text-amber-800", low: "bg-red-50 text-red-700" };
  const riskCls = { low: "text-emerald-700", medium: "text-amber-700", high: "text-red-700" };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h1">{d.forecast.title}</h1>
        <p className="text-sm text-ink-500">{d.forecast.subtitle}</p>
      </div>
      {!allowed ? <LockNote text={d.intel.lockedForecast} /> : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="label">{d.forecast.horizon}</p>
              <div className="flex gap-1.5">
                {HORIZONS.map((x) => (
                  <Link key={x} href={`?h=${x}`} className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${x === h ? "bg-ink-900 text-white" : "bg-white text-ink-700 ring-1 ring-ink-200"}`}>{fmt(d.forecast.days, { n: x })}</Link>
                ))}
              </div>
            </div>
            <ForecastRunForm horizon={h} />
          </div>

          {!f && <div className="card p-6 text-center text-sm text-ink-600">{d.forecast.none}</div>}

          {f && f.status === "insufficient_data" && (
            <div className="card space-y-2 p-5" data-testid="forecast-insufficient">
              <h2 className="h2">{d.forecast.insufficientTitle}</h2>
              <p className="text-sm text-ink-600">{fmt(d.forecast.insufficientText, { days: f.requirements!.min_days, sales: f.requirements!.min_sales, haveDays: f.data_used.days, haveSales: f.data_used.sales })}</p>
              <p className="text-xs text-ink-400">{fmt(d.forecast.generatedOn, { date: formatDate(f.generated_on, lang) })}</p>
            </div>
          )}

          {f && f.status === "ok" && (
            <>
              <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="text-sm">
                  <p className="font-semibold">{fmt(d.forecast.period, { from: formatDate(f.period!.from, lang), to: formatDate(f.period!.to, lang) })}</p>
                  <p className="text-xs text-ink-500">{fmt(d.forecast.generatedOn, { date: formatDate(f.generated_on, lang) })}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-500">{d.forecast.confidence}</p>
                  <span className={`badge ${confCls[f.confidence!]}`} data-testid="confidence">{d.forecast[`conf_${f.confidence!}`]}</span>
                </div>
                <p className="w-full text-xs text-ink-500">{fmt(d.forecast.confWhy, { days: f.data_used.days, cv: formatPercent(f.variability!.revenue, lang) })}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {([["revenue", f.revenue!], ["collected", f.collected!], ["expenses", f.expenses!]] as const).map(([k, b]) => (
                  <div key={k} className="card p-4" data-testid={`fc-${k}`}>
                    <p className="text-xs text-ink-500">{d.forecast[k]}</p>
                    <p className={`text-xl font-bold ${k === "revenue" ? "text-brand-700" : ""}`}>{m(b.expected)}</p>
                    <p className="text-[11px] text-ink-500">{fmt(d.forecast.range, { low: m(b.low), high: m(b.high) })}</p>
                    <p className="text-[11px] text-ink-400">{fmt(d.forecast.perDay, { v: m(b.daily) })}</p>
                  </div>
                ))}
              </div>

              <section className="card p-5">
                <h2 className="h2 mb-3">{d.forecast.cashTitle}</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {f.cash!.opening_set ? (
                    <>
                      <div><p className="text-xs text-ink-500">{d.forecast.cashCurrent}</p><p className="text-lg font-bold">{m(f.cash!.current_estimate)}</p></div>
                      <div><p className="text-xs text-ink-500">{d.forecast.cashEnd}</p><p className={`text-lg font-bold ${Number(f.cash!.projected_end) < 0 ? "text-red-700" : ""}`} data-testid="cash-end">{m(f.cash!.projected_end)}</p></div>
                    </>
                  ) : (
                    <div className="sm:col-span-2"><p className="text-xs text-ink-500">{d.forecast.cashNet}</p><p className="text-lg font-bold">{m(f.cash!.net_flow)}</p>
                      <p className="mt-1 text-xs text-ink-500">{d.forecast.cashNoOpening} <Link className="font-semibold text-brand-700" href="/app/settings">{d.nav.settings}</Link></p></div>
                  )}
                  <div><p className="text-xs text-ink-500">{d.forecast.risk}</p><p className={`text-lg font-bold ${riskCls[f.cash!.risk]}`} data-testid="risk">{d.forecast[`risk_${f.cash!.risk}`]}</p></div>
                </div>
                {f.cash!.days_until_zero != null && <p className="alert-error mt-3">{fmt(d.forecast.cashZero, { n: f.cash!.days_until_zero })}</p>}
                {Number(f.pending_receivables) > 0 && <p className="mt-3 text-sm text-ink-600">{fmt(d.forecast.pending, { v: m(f.pending_receivables) })}</p>}
              </section>

              <section className="card p-5">
                <h2 className="h2 mb-3">{d.forecast.restockTitle}</h2>
                {f.restock!.length === 0 ? <p className="text-sm text-ink-500">{d.forecast.restockNone}</p> : (
                  <div className="table-wrap"><table className="table">
                    <thead><tr><th>{d.forecast.restockCols.product}</th><th className="!text-right">{d.forecast.restockCols.stock}</th><th className="!text-right">{d.forecast.restockCols.daily}</th><th className="!text-right">{d.forecast.restockCols.cover}</th><th className="!text-right">{d.forecast.restockCols.qty}</th></tr></thead>
                    <tbody>{f.restock!.map((r) => (
                      <tr key={r.id}><td><Link className="font-medium hover:underline" href={`/app/products/${r.id}`}>{r.name}</Link></td><td className="text-right">{formatNumber(r.stock, lang)}</td><td className="text-right">{formatNumber(r.daily_units, lang, 2)}</td><td className="text-right">{formatNumber(r.cover_days, lang, 1)}</td><td className="text-right font-bold text-brand-700">{formatNumber(r.suggested_qty, lang)}</td></tr>
                    ))}</tbody>
                  </table></div>
                )}
              </section>

              <AiExplain kind="forecast" enabled={aiEnabled() && entitlements.ai_enabled !== false} />

              <section className="card grid gap-5 p-5 sm:grid-cols-3">
                <div><h3 className="mb-2 text-sm font-semibold">{d.forecast.dataUsed}</h3>
                  <p className="text-sm text-ink-600">{fmt(d.forecast.dataUsedText, { days: f.data_used.days, from: formatDate(f.data_used.from, lang), to: formatDate(f.data_used.to, lang), sales: f.data_used.sales, expenses: f.data_used.expenses, payments: f.data_used.payments })}</p></div>
                <div><h3 className="mb-2 text-sm font-semibold">{d.forecast.hypotheses}</h3>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-ink-600">{f.hypotheses!.map((k) => <li key={k}>{hypothesisText(k, f, d)}</li>)}</ul></div>
                <div><h3 className="mb-2 text-sm font-semibold">{d.forecast.limits}</h3>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-ink-600">{f.limits!.map((k) => <li key={k}>{limitText(k, d)}</li>)}</ul></div>
              </section>
            </>
          )}

          {rows && rows.length > 1 && (
            <section className="card p-5">
              <h2 className="h2 mb-3">{d.forecast.history}</h2>
              <ul className="divide-y divide-ink-100 text-sm">
                {rows.slice(1).map((r) => {
                  const p = r.payload as ForecastPayload;
                  return <li key={r.id} className="flex justify-between py-2"><span>{formatDate(r.created_at, lang)}</span><span>{p.status === "ok" ? `${d.forecast.revenue} : ${m(p.revenue!.expected)} · ${d.forecast[`conf_${p.confidence!}`]}` : d.forecast.insufficientTitle}</span></li>;
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
