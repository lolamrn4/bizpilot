import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { fmt } from "@/i18n";
import { formatDate, formatMoney, formatNumber } from "@/lib/money";
import { siteUrl } from "@/lib/site";
import { hasIntlPhone, waLink } from "@/lib/whatsapp";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmButton } from "@/components/forms";
import { CustomerForm } from "../CustomerForms";
import { deleteCustomerAction } from "../actions";

type Detail = {
  customer: { id: string; name: string; phone: string; note: string };
  currency: string; bought: number; paid: number; owed: number; days_unpaid: number | null;
  sales: { id: string; date: string; item: string; quantity: number; total: number; paid: number; remaining: number;
           status: "paid" | "partial" | "pending"; currency: string; receipt_number: number; receipt_token: string }[];
};

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, business, isManager } = await getAppContext();
  const { d, lang } = await getDict();
  const { data, error } = await supabase.rpc("customer_detail", { p_customer: id });
  if (error || !data) notFound();
  const c = data as Detail;
  const m = (v: number, cur = c.currency) => formatMoney(v, cur, lang);
  const unpaid = c.sales.filter((s) => s.status !== "paid");
  const base = await siteUrl();
  const lines = unpaid.slice(0, 5).map((s) =>
    fmt(d.customers.reminderLine, { number: `${s.date.slice(0, 4)}-${String(s.receipt_number).padStart(6, "0")}`, item: s.item, amount: m(s.remaining, s.currency), link: `${base}/r/${s.receipt_token}` }));
  const reminder = fmt(d.customers.reminderText, { name: c.customer.name, business: business.name, amount: m(c.owed) }) + (lines.length ? "\n" + lines.join("\n") : "") + "\n" + d.customers.reminderThanks;
  return (
    <div className="space-y-5">
      <Link href="/app/customers" className="text-sm font-medium text-ink-500 hover:text-ink-800">← {d.common.back}</Link>
      <div>
        <h1 className="h1">{c.customer.name}</h1>
        {c.customer.phone && <p className="text-sm text-ink-500">{c.customer.phone}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card col-span-2 p-4 sm:order-last sm:col-span-1" data-testid="customer-owed"><p className="text-xs text-ink-500">{d.customers.owed}</p><p className={`text-xl font-bold whitespace-nowrap sm:text-base ${c.owed > 0 ? "text-amber-700" : ""}`}>{m(c.owed)}</p></div>
        <div className="card min-w-0 p-4"><p className="text-xs text-ink-500">{d.customers.bought}</p><p className="font-bold whitespace-nowrap">{m(c.bought)}</p></div>
        <div className="card min-w-0 p-4"><p className="text-xs text-ink-500">{d.customers.paid}</p><p className="font-bold whitespace-nowrap text-emerald-700">{m(c.paid)}</p></div>
      </div>

      {c.owed > 0 && (
        <section className="card space-y-3 border-amber-200 bg-amber-50/40 p-5" data-testid="reminder">
          <h2 className="h2">{d.customers.reminderTitle}</h2>
          <p className="text-sm text-ink-600">{fmt(d.customers.reminderIntro, { amount: m(c.owed), n: c.days_unpaid ?? 0 })}</p>
          <pre className="rounded-xl bg-white p-3 text-xs whitespace-pre-wrap text-ink-700 [overflow-wrap:anywhere]">{reminder}</pre>
          <div className="flex flex-wrap gap-2">
            <a className="btn-primary" target="_blank" rel="noopener noreferrer" href={waLink(c.customer.phone, reminder)}>{d.customers.sendReminder}</a>
            {c.customer.phone && <a className="btn-secondary" href={`tel:${c.customer.phone.replace(/\s/g, "")}`}>{d.customers.call}</a>}
          </div>
          {!hasIntlPhone(c.customer.phone) && <p className="text-xs text-ink-500">{d.customers.noIntlPhone}</p>}
        </section>
      )}

      <section className="card p-5">
        <h2 className="h2 mb-3">{d.customers.history}</h2>
        {c.sales.length === 0 ? <p className="text-sm text-ink-500">{d.customers.noSales}</p> : (
          <ul className="divide-y divide-ink-100">
            {c.sales.map((s) => (
              <li key={s.id}>
                <Link href={`/app/sales/${s.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-ink-50" data-testid="customer-sale">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.item} <span className="text-xs text-ink-400">× {formatNumber(s.quantity, lang)}</span></p>
                    <p className="text-xs text-ink-500">{formatDate(s.date, lang)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold">{m(s.total, s.currency)}</p>
                    {s.remaining > 0 ? <p className="text-xs text-amber-700">{d.sales.remaining} : {m(s.remaining, s.currency)}</p> : <StatusBadge status={s.status} d={d} />}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5"><h2 className="h2 mb-4">{d.customers.edit}</h2><CustomerForm customer={c.customer} /></section>
      {isManager && (
        <section className="card p-5">
          <p className="mb-3 text-sm text-ink-500">{d.customers.deleteHint}</p>
          <form action={deleteCustomerAction}><input type="hidden" name="id" value={c.customer.id} /><ConfirmButton>{d.customers.delete}</ConfirmButton></form>
        </section>
      )}
    </div>
  );
}
