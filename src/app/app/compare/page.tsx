import Link from "next/link";
import { requireManager, can } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { fmt } from "@/i18n";
import { resolvePeriod } from "@/lib/periods";
import { formatMoney, formatNumber } from "@/lib/money";
import { errorMessage } from "@/lib/errors";
import { PeriodFilter } from "@/components/PeriodFilter";
import { LockNote } from "@/components/forms";
import { switchBusinessAction } from "../team/actions";

type Row = { id: string; name: string; currency: string; revenue: number; collected: number; expenses: number; result: number; sales_count: number; pending: number };
type Total = { currency: string; businesses: number; revenue: number; collected: number; expenses: number; result: number; pending: number };

export default async function ComparePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { supabase, business, entitlements } = await requireManager();
  const { d, lang } = await getDict();
  const sp = await searchParams;
  if (!can(entitlements, "comparative_reports")) {
    return (
      <div className="space-y-5">
        <h1 className="h1">{d.compare.title}</h1>
        <LockNote text={d.compare.locked} />
        <Link href="/app/billing" className="btn-primary">{d.nav.billing}</Link>
      </div>
    );
  }
  const p = resolvePeriod(business.timezone, sp.period, sp.from, sp.to);
  const { data, error } = await supabase.rpc("compare_businesses", { p_from: p.from, p_to: p.to });
  const rows = ((data as { rows?: Row[] } | null)?.rows ?? []) as Row[];
  const totals = ((data as { totals?: Total[] } | null)?.totals ?? []) as Total[];
  const m = (v: number, c: string) => formatMoney(v, c, lang);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="h1">{d.compare.title}</h1>
        <p className="text-sm text-ink-500">{d.compare.subtitle}</p>
      </div>
      <PeriodFilter period={p.period} from={p.from} to={p.to} allPeriods />
      {error && <p className="alert-error">{errorMessage(error, d)}</p>}
      {rows.length === 0 ? (
        <p className="text-sm text-ink-500">{d.compare.empty}</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <section key={r.id} className="card p-4" data-testid="compare-row">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="truncate font-semibold text-ink-900">{r.name}</h2>
                  <span className="badge bg-ink-100 text-ink-600">{r.currency}</span>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                  <dt className="text-ink-500">{d.compare.revenue}</dt><dd className="text-right font-semibold">{m(r.revenue, r.currency)}</dd>
                  <dt className="text-ink-500">{d.compare.collected}</dt><dd className="text-right">{m(r.collected, r.currency)}</dd>
                  <dt className="text-ink-500">{d.compare.expenses}</dt><dd className="text-right">{m(r.expenses, r.currency)}</dd>
                  <dt className="text-ink-500">{d.compare.result}</dt>
                  <dd className={`text-right font-semibold ${r.result < 0 ? "text-red-600" : "text-emerald-700"}`}>{m(r.result, r.currency)}</dd>
                  <dt className="text-ink-500">{d.compare.sales}</dt><dd className="text-right">{formatNumber(r.sales_count, lang)}</dd>
                  <dt className="text-ink-500">{d.compare.pending}</dt><dd className="text-right">{m(r.pending, r.currency)}</dd>
                </dl>
                {r.id !== business.id && (
                  <form action={switchBusinessAction} className="mt-3">
                    <input type="hidden" name="business" value={r.id} />
                    <button className="btn-secondary w-full py-1.5 text-sm">{d.compare.open}</button>
                  </form>
                )}
              </section>
            ))}
          </div>
          <section className="card p-4 sm:p-5">
            <h2 className="h2 mb-3">{d.compare.totals}</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-ink-500">
                    <th className="py-2">{d.onboarding.currency}</th>
                    <th className="py-2 text-right">{d.compare.revenue}</th>
                    <th className="py-2 text-right">{d.compare.expenses}</th>
                    <th className="py-2 text-right">{d.compare.result}</th>
                    <th className="py-2 text-right">{d.compare.pending}</th>
                  </tr>
                </thead>
                <tbody>
                  {totals.map((t) => (
                    <tr key={t.currency} className="border-b border-ink-50" data-testid="compare-total">
                      <td className="py-2 font-medium">{t.currency} <span className="text-xs text-ink-400">· {fmt(d.compare.businessesCount, { n: t.businesses })}</span></td>
                      <td className="py-2 text-right">{m(t.revenue, t.currency)}</td>
                      <td className="py-2 text-right">{m(t.expenses, t.currency)}</td>
                      <td className="py-2 text-right font-semibold">{m(t.result, t.currency)}</td>
                      <td className="py-2 text-right">{m(t.pending, t.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
