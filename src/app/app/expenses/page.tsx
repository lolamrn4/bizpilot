import Link from "next/link";
import { getAppContext, can } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { resolvePeriod } from "@/lib/periods";
import { formatDate, formatMoney } from "@/lib/money";
import { PeriodFilter } from "@/components/PeriodFilter";
import type { Expense, ExpenseCategory } from "@/lib/types";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { supabase, business, entitlements, isManager } = await getAppContext();
  const { d, lang } = await getDict();
  const sp = await searchParams;
  const p = resolvePeriod(business.timezone, sp.period, sp.from, sp.to);
  const q = (sp.q ?? "").trim().replace(/[%,()]/g, " ");
  let query = supabase.from("expenses").select("*, expense_categories(code, name)").eq("business_id", business.id)
    .gte("expense_date", p.from).lte("expense_date", p.to).order("expense_date", { ascending: false }).order("created_at", { ascending: false }).limit(300);
  if (sp.category) query = query.eq("category_id", sp.category);
  if (q) query = query.ilike("name", `%${q}%`);
  const [{ data }, { data: cats }] = await Promise.all([query, supabase.from("expense_categories").select("id, business_id, code, name").order("created_at")]);
  const rows = (data ?? []) as Expense[];
  const total = rows.reduce((s, e) => s + Number(e.amount), 0); // même devise (celle de l'entreprise)
  const label = (c: { code: string | null; name: string } | null | undefined) => (c?.code ? d.categories[c.code as keyof typeof d.categories] : c?.name ?? "");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="h1">{d.expenses.title}</h1>
        <Link href="/app/expenses/new" className="btn-primary">+ {d.expenses.new}</Link>
      </div>
      {sp.created && <p className="alert-ok">{d.common.saved}</p>}
      <PeriodFilter period={p.period} from={p.from} to={p.to} allPeriods={can(entitlements, "all_periods")} />
      <form className="flex flex-wrap gap-2">
        <input type="hidden" name="period" value={p.period} />
        {p.period === "custom" && <><input type="hidden" name="from" value={p.from} /><input type="hidden" name="to" value={p.to} /></>}
        <input className="input max-w-xs flex-1" name="q" defaultValue={sp.q} placeholder={d.expenses.searchPh} />
        <select className="input w-auto" name="category" defaultValue={sp.category ?? ""}>
          <option value="">{d.common.all}</option>
          {((cats ?? []) as ExpenseCategory[]).map((c) => <option key={c.id} value={c.id}>{label(c)}</option>)}
        </select>
        <button className="btn-secondary">{d.common.filter}</button>
      </form>
      {rows.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-600">{d.expenses.empty}</div>
      ) : (
        <>
          <div className="card divide-y divide-ink-100">
            {rows.map((e) => (
              <Link key={e.id} href={isManager ? `/app/expenses/${e.id}` : "#"} aria-disabled={!isManager} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-ink-50">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{e.name}{e.receipt_path ? " 📎" : ""}</p>
                  <p className="truncate text-xs text-ink-500">{formatDate(e.expense_date, lang)} · {label(e.expense_categories)}</p>
                </div>
                <p className="shrink-0 font-bold">{formatMoney(e.amount, e.currency, lang)}</p>
              </Link>
            ))}
          </div>
          <p className="text-right text-sm text-ink-600">{d.common.total} : <b>{formatMoney(total, business.currency, lang)}</b></p>
        </>
      )}
    </div>
  );
}
