import Link from "next/link";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { fmt } from "@/i18n";
import { formatDate, formatMoney, formatNumber } from "@/lib/money";
import { errorMessage } from "@/lib/errors";
import { CustomerForm } from "./CustomerForms";

type Row = { id: string; name: string; phone: string; sales_count: number; bought: number; paid: number; owed: number; last_sale: string | null; days_unpaid: number | null };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; debt?: string; new?: string }> }) {
  const { supabase, business } = await getAppContext();
  const { d, lang } = await getDict();
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 80);
  const onlyDebt = sp.debt === "1";
  const { data, error } = await supabase.rpc("customers_overview", { p_business: business.id, p_search: q, p_only_debt: onlyDebt });
  const o = (data ?? { currency: business.currency, total_owed: 0, debtors: 0, customers: [] }) as { currency: string; total_owed: number; debtors: number; customers: Row[] };
  const m = (v: number) => formatMoney(v, o.currency, lang);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="h1">{d.customers.title}</h1>
        <Link href="/app/customers?new=1" className="btn-primary">+ {d.customers.new}</Link>
      </div>
      {error && <p className="alert-error">{errorMessage(error, d)}</p>}
      {sp.new === "1" && <section className="card p-5"><h2 className="h2 mb-3">{d.customers.new}</h2><CustomerForm /></section>}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/app/customers?debt=1" className="card block p-4" data-testid="total-owed">
          <p className="text-xs text-ink-500">{d.customers.totalOwed}</p>
          <p className={`text-lg font-bold ${o.total_owed > 0 ? "text-amber-700" : ""}`}>{m(o.total_owed)}</p>
        </Link>
        <div className="card p-4">
          <p className="text-xs text-ink-500">{d.customers.debtors}</p>
          <p className="text-lg font-bold">{formatNumber(o.debtors, lang)}</p>
        </div>
      </div>
      <form className="flex flex-wrap items-center gap-2">
        <input className="input max-w-xs flex-1" name="q" defaultValue={q} placeholder={d.customers.searchPh} />
        <label className="flex items-center gap-2 text-sm text-ink-600"><input type="checkbox" name="debt" value="1" defaultChecked={onlyDebt} className="size-4 accent-brand-600" />{d.customers.onlyDebt}</label>
        <button className="btn-secondary">{d.common.search}</button>
      </form>
      {o.customers.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-600">{d.customers.empty}</div>
      ) : (
        <div className="card divide-y divide-ink-100">
          {o.customers.map((c) => (
            <Link key={c.id} href={`/app/customers/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-ink-50" data-testid="customer-row">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900">{c.name}</p>
                <p className="truncate text-xs text-ink-500">
                  {fmt(d.customers.salesCount, { n: c.sales_count })}
                  {c.last_sale ? ` · ${fmt(d.customers.lastSale, { date: formatDate(c.last_sale, lang) })}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                {c.owed > 0 ? (
                  <>
                    <p className="font-bold text-amber-700">{m(c.owed)}</p>
                    <p className="text-[11px] text-ink-500">{fmt(d.customers.since, { n: c.days_unpaid ?? 0 })}</p>
                  </>
                ) : (
                  <p className="text-sm text-emerald-700">{d.customers.upToDate}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
