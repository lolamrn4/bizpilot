import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/i18n/server";
import { formatDate, formatNumber } from "@/lib/money";

type B = { id: string; name: string; sector: string; city: string; currency: string; created_at: string; owner_email: string; plan: string; products: number; sales: number; expenses: number; last_activity: string | null };

export default async function AdminBusinesses({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createClient();
  const { d, lang } = await getDict();
  const sp = await searchParams;
  const { data } = await supabase.rpc("admin_businesses", { p_search: sp.q ?? "", p_limit: 200, p_offset: 0 });
  const r = data as { total: number; rows: B[] };
  const t = d.admin.biz;
  return (
    <>
      <form className="flex gap-2"><input className="input max-w-sm" name="q" defaultValue={sp.q} placeholder={t.search} /><button className="btn-secondary">{d.common.search}</button></form>
      <p className="text-sm text-ink-500">{r.total}</p>
      <div className="card table-wrap"><table className="table">
        <thead><tr><th>{t.name}</th><th>{t.owner}</th><th>{d.admin.users.plan}</th><th>{t.currency}</th><th className="!text-right">{t.products}</th><th className="!text-right">{t.sales}</th><th className="!text-right">{t.expenses}</th><th>{t.lastActivity}</th><th>{t.created}</th></tr></thead>
        <tbody>{r.rows.map((b) => (
          <tr key={b.id} data-testid="admin-biz"><td className="font-medium">{b.name}<span className="block text-xs text-ink-400">{[b.sector, b.city].filter(Boolean).join(" · ")}</span></td><td>{b.owner_email}</td><td>{d.plans[b.plan as "free"]}</td><td>{b.currency}</td>
            <td className="text-right">{formatNumber(b.products, lang)}</td><td className="text-right">{formatNumber(b.sales, lang)}</td><td className="text-right">{formatNumber(b.expenses, lang)}</td>
            <td>{b.last_activity ? formatDate(b.last_activity, lang) : "—"}</td><td>{formatDate(b.created_at, lang)}</td></tr>
        ))}</tbody>
      </table></div>
    </>
  );
}
