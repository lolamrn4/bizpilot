import { getAppContext, can } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { fmt } from "@/i18n";
import { resolvePeriod } from "@/lib/periods";
import { errorMessage } from "@/lib/errors";
import { PeriodFilter } from "@/components/PeriodFilter";
import { LockNote } from "@/components/forms";
import { SECTIONS, sectionTable, sectionTitle, type ReportData } from "@/lib/report";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { supabase, business, entitlements } = await getAppContext();
  const { d, lang } = await getDict();
  const sp = await searchParams;
  const p = resolvePeriod(business.timezone, sp.period, sp.from, sp.to);
  const { data, error } = await supabase.rpc("report_data", { p_business: business.id, p_from: p.from, p_to: p.to });
  const exportsOk = can(entitlements, "exports");
  const qs = (section: string, format: string) => `/api/export?${new URLSearchParams({ section, format, period: p.period, from: p.from, to: p.to })}`;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="h1">{d.reports.title}</h1>
        <p className="text-sm text-ink-500">{d.reports.subtitle}</p>
      </div>
      <PeriodFilter period={p.period} from={p.from} to={p.to} allPeriods={can(entitlements, "all_periods")} />
      {!exportsOk && <LockNote text={d.reports.exportLocked} />}
      {error && <p className="alert-error">{errorMessage(error, d)}</p>}
      {data && SECTIONS.map((s) => {
        const t = sectionTable(s, data as ReportData, d, lang, business.currency, true);
        return (
          <section key={s} className="card p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="h2">{sectionTitle(s, d)} <span className="text-xs font-normal text-ink-400">{s !== "summary" && fmt(d.reports.rows, { n: t.rows.length })}</span></h2>
              {exportsOk && (
                <div className="flex gap-2">
                  <a className="btn-secondary px-3 py-1.5 text-xs" href={qs(s, "csv")} download>{d.reports.exportCsv}</a>
                  <a className="btn-secondary px-3 py-1.5 text-xs" href={qs(s, "pdf")} download>{d.reports.exportPdf}</a>
                </div>
              )}
            </div>
            {t.rows.length === 0 ? <p className="text-sm text-ink-500">{d.common.noData}</p> : (
              <div className="table-wrap max-h-96 overflow-y-auto">
                <table className="table">
                  <thead className="sticky top-0 bg-white"><tr>{t.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>{t.rows.slice(0, 200).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
      <section className="card p-5">
        <h2 className="h2">{d.reports.backup}</h2>
        <p className="mt-1 mb-3 text-sm text-ink-600">{d.reports.backupText}</p>
        <a href="/api/backup" className="btn-secondary" download>{d.reports.backupBtn}</a>
      </section>
    </div>
  );
}
