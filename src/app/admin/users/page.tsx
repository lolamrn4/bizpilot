import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/i18n/server";
import { fmt } from "@/i18n";
import { formatDate } from "@/lib/money";
import { UserPlanForm } from "../AdminForms";

type U = { id: string; email: string; full_name: string | null; created_at: string; last_sign_in_at: string | null; confirmed: boolean;
  plan_code: string; status: string; provider: string | null; current_period_end: string | null; effective_plan: string; is_admin: boolean; businesses: number };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const supabase = await createClient();
  const { d, lang } = await getDict();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { data } = await supabase.rpc("admin_users", { p_search: sp.q ?? "", p_limit: 50, p_offset: (page - 1) * 50 });
  const r = data as { total: number; rows: U[] };
  const src = (p: string | null) => d.admin.users.sources[(p ?? "none") as keyof typeof d.admin.users.sources] ?? p;
  return (
    <>
      <form className="flex gap-2"><input className="input max-w-sm" name="q" defaultValue={sp.q} placeholder={d.admin.users.search} /><button className="btn-secondary">{d.common.search}</button></form>
      <p className="text-sm text-ink-500">{r.total}</p>
      <div className="space-y-3">
        {r.rows.map((u) => (
          <article key={u.id} className="card p-4" data-testid="admin-user">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{u.full_name || "—"} {u.is_admin && <span className="badge ml-1 bg-ink-900 text-white">{d.admin.users.admin}</span>}</p>
                <p className="text-sm text-ink-600">{u.email}{!u.confirmed && <span className="ml-2 text-xs text-amber-700">({d.admin.users.confirmedNo})</span>}</p>
                <p className="text-xs text-ink-400">{d.admin.users.created} {formatDate(u.created_at, lang)} · {d.admin.users.lastSeen} {u.last_sign_in_at ? formatDate(u.last_sign_in_at, lang) : "—"} · {d.admin.users.businesses} : {u.businesses}</p>
              </div>
              <div className="text-right text-sm">
                <span className="badge bg-brand-50 text-brand-700">{d.plans[u.effective_plan as "free"]}</span>
                <p className="mt-1 text-xs text-ink-500">{src(u.provider)} · {u.status}{u.current_period_end && u.effective_plan !== "free" ? ` · ${fmt(d.admin.users.until, { date: formatDate(u.current_period_end, lang) })}` : ""}</p>
              </div>
            </div>
            <div className="mt-3 border-t border-ink-100 pt-3">
              <p className="mb-1.5 text-xs font-semibold text-ink-500">{d.admin.users.grant}</p>
              <UserPlanForm userId={u.id} locked={u.provider === "paddle" && ["active", "trialing", "past_due"].includes(u.status)} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
