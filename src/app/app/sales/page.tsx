import Link from "next/link";
import { getAppContext, can } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { resolvePeriod } from "@/lib/periods";
import { formatDate, formatMoney, formatNumber } from "@/lib/money";
import { PeriodFilter } from "@/components/PeriodFilter";
import { StatusBadge } from "@/components/StatusBadge";
import type { Sale } from "@/lib/types";

const PAGE = 50;

export default async function SalesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { supabase, business, entitlements } = await getAppContext();
  const { d, lang } = await getDict();
  const sp = await searchParams;
  const allPeriods = can(entitlements, "all_periods");
  const p = resolvePeriod(business.timezone, sp.period, sp.from, sp.to);
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").trim().replace(/[%,()]/g, " ");
  const status = sp.status ?? "";
  let query = supabase.from("sales").select("*", { count: "exact" }).eq("business_id", business.id)
    .order("sale_date", { ascending: false }).order("created_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  // « À encaisser » (lien du tableau de bord) : toutes les ventes non soldées, sans limite de période.
  if (status !== "unpaid") query = query.gte("sale_date", p.from).lte("sale_date", p.to);
  if (status === "unpaid") query = query.neq("status", "paid");
  else if (["paid", "partial", "pending"].includes(status)) query = query.eq("status", status);
  if (q) query = query.or(`item_name.ilike.%${q}%,customer_name.ilike.%${q}%`);
  const { data, count } = await query;
  const sales = (data ?? []) as Sale[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const link = (n: number) => { const u = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]); u.set("page", String(n)); return `?${u}`; };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="h1">{d.sales.title}</h1>
        <Link href="/app/sales/new" className="btn-primary">+ {d.sales.new}</Link>
      </div>
      {sp.created && <p className="alert-ok">{d.common.saved}</p>}
      {status !== "unpaid" && <PeriodFilter period={p.period} from={p.from} to={p.to} allPeriods={allPeriods} />}
      <form className="flex flex-wrap gap-2">
        <input type="hidden" name="period" value={p.period} />
        {p.period === "custom" && <><input type="hidden" name="from" value={p.from} /><input type="hidden" name="to" value={p.to} /></>}
        <input className="input max-w-xs flex-1" name="q" defaultValue={sp.q} placeholder={d.sales.searchPh} />
        <select className="input w-auto" name="status" defaultValue={status}>
          <option value="">{d.common.all}</option>
          <option value="paid">{d.sales.paid}</option>
          <option value="partial">{d.sales.partial}</option>
          <option value="pending">{d.sales.pending}</option>
          <option value="unpaid">{d.dashboard.pending}</option>
        </select>
        <button className="btn-secondary">{d.common.filter}</button>
      </form>
      {sales.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-600">{d.sales.empty}</div>
      ) : (
        <div className="card divide-y divide-ink-100">
          {sales.map((s) => (
            <Link key={s.id} href={`/app/sales/${s.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-ink-50">
              <div className="min-w-0">
                <p className="truncate font-semibold">{s.item_name} <span className="font-normal text-ink-400">× {formatNumber(s.quantity, lang)}</span></p>
                <p className="truncate text-xs text-ink-500">{formatDate(s.sale_date, lang)}{s.customer_name ? ` · ${s.customer_name}` : ""} · {d.methods[s.payment_method as keyof typeof d.methods]}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-bold">{formatMoney(s.total, s.currency, lang)}</p>
                <StatusBadge status={s.status} d={d} />
              </div>
            </Link>
          ))}
        </div>
      )}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? <Link className="btn-secondary" href={link(page - 1)}>{d.common.previous}</Link> : <span />}
          <span className="text-ink-500">{page} / {pages}</span>
          {page < pages ? <Link className="btn-secondary" href={link(page + 1)}>{d.common.next}</Link> : <span />}
        </div>
      )}
    </div>
  );
}
