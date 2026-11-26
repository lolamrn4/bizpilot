import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/i18n/server";
import { formatMoney, formatNumber } from "@/lib/money";

type Stats = {
  users_total: number; users_confirmed: number; users_7d: number; users_30d: number; businesses_total: number; businesses_active_30d: number;
  plans: Record<string, number>; paying: Record<string, number>; mrr_usd_estimate: number; manual_access: number;
  sales_30d: number; expenses_30d: number; ai_30d: number; ai_rejected_30d: number; errors_7d: number; billing_errors_7d: number;
  signups: { day: string; n: number }[];
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { d, lang } = await getDict();
  const { data } = await supabase.rpc("admin_stats");
  const s = data as Stats;
  const n = (v: number) => formatNumber(v, lang);
  const paying = Object.values(s.paying).reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...s.signups.map((x) => x.n));
  const card = (label: string, value: string, hint?: string, tone = "") => (
    <div className="card p-4"><p className="text-xs text-ink-500">{label}</p><p className={`text-2xl font-bold ${tone}`}>{value}</p>{hint && <p className="text-[11px] text-ink-400">{hint}</p>}</div>
  );
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="admin-stats">
        {card(d.admin.stats.users, n(s.users_total), `${n(s.users_confirmed)} ${d.admin.stats.confirmed}`)}
        {card(d.admin.stats.new7, n(s.users_7d), `${d.admin.stats.new30} : ${n(s.users_30d)}`)}
        {card(d.admin.stats.businesses, n(s.businesses_total), `${n(s.businesses_active_30d)} ${d.admin.stats.active30}`)}
        {card(d.admin.stats.paying, n(paying), `${d.admin.stats.manual} : ${n(s.manual_access)}`, "text-brand-700")}
        {card(d.admin.stats.mrr, formatMoney(s.mrr_usd_estimate, "USD", lang), d.admin.stats.mrrHint, "text-emerald-700")}
        {card(d.admin.stats.errors7, n(s.errors_7d), undefined, s.errors_7d ? "text-red-700" : "")}
        {card(d.admin.stats.billingErrors7, n(s.billing_errors_7d), undefined, s.billing_errors_7d ? "text-red-700" : "")}
        {card(d.admin.stats.activity, n(s.sales_30d), `${d.admin.stats.sales} · ${n(s.expenses_30d)} ${d.admin.stats.expenses}`)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5">
          <h2 className="h2 mb-3">{d.admin.stats.byPlan}</h2>
          <ul className="space-y-2 text-sm">
            {(["free", "standard", "premium", "business"] as const).map((p) => (
              <li key={p} className="flex justify-between"><span>{d.plans[p]}</span><b>{n(s.plans[p] ?? 0)}{s.paying[p] ? ` (${n(s.paying[p])} Paddle)` : ""}</b></li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-500">{d.admin.stats.ai} : {n(s.ai_30d)} · {d.admin.stats.aiRejected} : {n(s.ai_rejected_30d)}</p>
        </section>
        <section className="card p-5 lg:col-span-2">
          <h2 className="h2 mb-3">{d.admin.stats.signups}</h2>
          <div className="flex h-32 items-end gap-1" aria-label={d.admin.stats.signups}>
            {s.signups.map((x) => (
              <div key={x.day} title={`${x.day} : ${x.n}`} className="flex-1 rounded-t bg-brand-500/80" style={{ height: `${Math.max(2, (x.n / max) * 100)}%` }} />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-ink-400"><span>{s.signups[0]?.day}</span><span>{s.signups.at(-1)?.day}</span></div>
        </section>
      </div>
    </>
  );
}
