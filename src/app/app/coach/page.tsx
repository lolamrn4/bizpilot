import Link from "next/link";
import { requireManager, can } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { formatDate } from "@/lib/money";
import { LockNote } from "@/components/forms";
import { AiExplain } from "@/components/AiExplain";
import { aiEnabled } from "@/lib/ai";
import { renderRecommendation, type Recommendation } from "@/lib/intel-text";
import { CoachRunForm } from "../IntelForms";
import { setRecStatusAction } from "../actions";

export default async function CoachPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { supabase, business, entitlements } = await requireManager();
  const { d, lang } = await getDict();
  const tab = (await searchParams).tab === "history" ? "history" : "open";
  const allowed = can(entitlements, "coach");
  const { data } = allowed
    ? await supabase.from("recommendations").select("*").eq("business_id", business.id)
        .in("status", tab === "open" ? ["open"] : ["done", "expired"]).order(tab === "open" ? "priority" : "updated_at", { ascending: tab === "open" }).limit(100)
    : { data: [] };
  const { count: total } = allowed ? await supabase.from("recommendations").select("id", { count: "exact", head: true }).eq("business_id", business.id) : { count: 0 };
  const recs = (data ?? []) as Recommendation[];
  const pCls = { 1: "bg-red-50 text-red-700 ring-red-200", 2: "bg-amber-50 text-amber-800 ring-amber-200", 3: "bg-sky-50 text-sky-800 ring-sky-200" };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="h1">{d.coach.title}</h1>
          <p className="text-sm text-ink-500">{d.coach.subtitle}</p>
        </div>
        {allowed && <CoachRunForm />}
      </div>
      {!allowed ? <LockNote text={d.intel.lockedCoach} /> : (
        <>
          <div className="flex gap-1.5">
            <Link href="?tab=open" className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${tab === "open" ? "bg-ink-900 text-white" : "bg-white text-ink-700 ring-1 ring-ink-200"}`}>{d.coach.open}</Link>
            <Link href="?tab=history" className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${tab === "history" ? "bg-ink-900 text-white" : "bg-white text-ink-700 ring-1 ring-ink-200"}`}>{d.coach.historyTab}</Link>
          </div>
          {tab === "open" && recs.length > 0 && <AiExplain kind="coach" enabled={aiEnabled() && entitlements.ai_enabled !== false} />}
          {recs.length === 0 && <div className="card p-6 text-center text-sm text-ink-600">{(total ?? 0) === 0 ? d.coach.notRun : tab === "open" ? d.coach.empty : d.common.noData}</div>}
          <div className="space-y-3">
            {recs.map((r) => {
              const t = renderRecommendation(r, d, lang, business.currency);
              if (!t) return null;
              return (
                <article key={r.id} className="card p-4 sm:p-5" data-testid={`rec-${r.rule}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="h2">{t.title}</h2>
                    <div className="flex items-center gap-2">
                      {r.status !== "open" && <span className="badge bg-ink-100 text-ink-600">{r.status === "done" ? d.coach.done : d.coach.expired}</span>}
                      <span className={`badge ring-1 ${pCls[r.priority]}`}>{d.coach[`p${r.priority}`]}</span>
                    </div>
                  </div>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs font-semibold text-ink-500 uppercase">{d.coach.problem}</dt><dd>{t.problem}</dd></div>
                    <div><dt className="text-xs font-semibold text-ink-500 uppercase">{d.coach.figure}</dt><dd className="font-medium">{t.figure}</dd></div>
                    <div><dt className="text-xs font-semibold text-ink-500 uppercase">{d.coach.explanation}</dt><dd className="text-ink-700">{t.explanation}</dd></div>
                    <div><dt className="text-xs font-semibold text-ink-500 uppercase">{d.coach.action}</dt><dd className="font-semibold text-brand-800">{t.action}</dd></div>
                  </dl>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                    <span><b className="text-emerald-800">{d.coach.benefit} :</b> <span className="text-emerald-800">{t.benefit}</span> <span className="text-[11px] text-emerald-700/70">({d.coach.estimate})</span></span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-ink-400">{t.period}{r.done_at ? ` · ${d.coach.done} ${formatDate(r.done_at, lang)}` : ""}</p>
                    {r.status !== "expired" && (
                      <form action={setRecStatusAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value={r.status === "open" ? "done" : "open"} />
                        <button className={r.status === "open" ? "btn-secondary px-3 py-1.5 text-xs" : "btn-ghost px-3 py-1.5 text-xs"}>{r.status === "open" ? `✓ ${d.coach.markDone}` : d.coach.reopen}</button>
                      </form>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <p className="text-xs text-ink-400">{d.intel.aiDisclaimer}</p>
        </>
      )}
    </div>
  );
}
