import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppContext, can } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { todayIn } from "@/lib/periods";
import { formatDate, formatMoney } from "@/lib/money";
import { ConfirmButton } from "@/components/forms";
import { StatusBadge } from "@/components/StatusBadge";
import type { Payment, Sale } from "@/lib/types";
import { PaymentForm, SaleForm } from "../SaleForm";
import { deletePaymentAction, deleteSaleAction, regenerateReceiptLinkAction } from "../actions";
import { ReceiptActions } from "../ReceiptActions";
import { siteUrl } from "@/lib/site";

export default async function SalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, business, entitlements, isManager } = await getAppContext();
  const { d, lang } = await getDict();
  const { data } = await supabase.from("sales").select("*").eq("id", id).eq("business_id", business.id).maybeSingle();
  if (!data) notFound();
  const sale = data as Sale;
  const [{ data: pays }, { data: products }] = await Promise.all([
    supabase.from("sale_payments").select("id, sale_id, amount, currency, paid_on, method").eq("sale_id", id).order("paid_on"),
    supabase.from("products").select("id, name, sale_price, stock_quantity, unit_cost").eq("business_id", business.id).or(`archived.eq.false,id.eq.${sale.product_id ?? "00000000-0000-0000-0000-000000000000"}`).order("name"),
  ]);
  const { data: cust } = await supabase.from("customers").select("name").eq("business_id", business.id).order("name").limit(1000);
  const remaining = Number(sale.total) - Number(sale.amount_paid);
  const receiptNo = `${sale.sale_date.slice(0, 4)}-${String(sale.receipt_number ?? 0).padStart(6, "0")}`;
  const m = (v: number) => formatMoney(v, sale.currency, lang);
  const today = todayIn(business.timezone);
  return (
    <div className="space-y-5">
      <Link href="/app/sales" className="text-sm font-medium text-ink-500 hover:text-ink-800">← {d.common.back}</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="h1">{sale.item_name}</h1>
          <p className="text-sm text-ink-500">{formatDate(sale.sale_date, lang)}{sale.customer_name && !sale.customer_id ? ` · ${sale.customer_name}` : ""}
            {sale.customer_id && <> · <Link href={`/app/customers/${sale.customer_id}`} className="font-medium text-brand-700 hover:underline">{sale.customer_name}</Link></>}</p>
        </div>
        <StatusBadge status={sale.status} d={d} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4"><p className="text-xs text-ink-500">{d.common.total}</p><p className="font-bold">{m(sale.total)}</p></div>
        <div className="card p-4"><p className="text-xs text-ink-500">{d.sales.paid}</p><p className="font-bold text-emerald-700">{m(sale.amount_paid)}</p></div>
        <div className="card p-4"><p className="text-xs text-ink-500">{d.sales.remaining}</p><p className={`font-bold ${remaining > 0 ? "text-amber-700" : ""}`}>{m(remaining)}</p></div>
      </div>
      <section className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="h2">{sale.status === "paid" ? d.receipt.receipt : d.receipt.invoice} <span className="text-sm font-normal text-ink-500">{d.receipt.number} {receiptNo}</span></h2>
          {isManager && (
            <form action={regenerateReceiptLinkAction}>
              <input type="hidden" name="id" value={sale.id} />
              <button className="btn-ghost px-2 py-1 text-xs" title={d.receipt.regenerateHelp}>{d.receipt.regenerate}</button>
            </form>
          )}
        </div>
        <ReceiptActions saleId={sale.id} publicLink={`${await siteUrl()}/r/${sale.receipt_token}`} businessName={business.name} number={receiptNo} invoice={sale.status !== "paid"} />
      </section>
      <section className="card p-5">
        <h2 className="h2 mb-3">{d.sales.payments}</h2>
        {(pays ?? []).length === 0 ? <p className="mb-4 text-sm text-ink-500">{d.sales.noPayments}</p> : (
          <ul className="mb-4 divide-y divide-ink-100">
            {(pays as Payment[]).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>{formatDate(p.paid_on, lang)} · {d.methods[p.method as keyof typeof d.methods]}</span>
                <span className="flex items-center gap-3">
                  <b>{m(p.amount)}</b>
                  {isManager && <form action={deletePaymentAction}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="sale_id" value={sale.id} /><ConfirmButton className="btn-ghost px-2 py-1 text-xs text-red-700">{d.common.delete}</ConfirmButton></form>}
                </span>
              </li>
            ))}
          </ul>
        )}
        {remaining > 0 ? <PaymentForm saleId={sale.id} remaining={remaining} currency={sale.currency} today={today} partialAllowed={can(entitlements, "partial_payments")} /> : <p className="alert-ok">{d.sales.fullyPaid}</p>}
      </section>
      {isManager && <><section className="card p-5"><h2 className="h2 mb-4">{d.sales.editTitle}</h2><SaleForm sale={sale} products={products ?? []} currency={sale.currency} today={today} partialAllowed={can(entitlements, "partial_payments")} minMargin={Number(business.min_margin ?? 0.1)} customers={(cust ?? []).map((c) => c.name)} /></section>
      <section className="card p-5">
        <form action={deleteSaleAction}><input type="hidden" name="id" value={sale.id} /><ConfirmButton>{d.sales.deleteSale}</ConfirmButton></form>
      </section></>}
    </div>
  );
}
