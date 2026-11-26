import type { Dict } from "@/i18n";
import { fmt } from "@/i18n";
import { formatDate, formatMoney, formatNumber } from "@/lib/money";
import { isInvoice, logoUrl, receiptNumber, type ReceiptPayload } from "@/lib/receipt";

/** Aperçu du reçu / de la facture (mêmes informations que le PDF). */
export function ReceiptView({ r, d, lang }: { r: ReceiptPayload; d: Dict; lang: "fr" | "en" }) {
  const m = (v: number) => formatMoney(v, r.sale.currency, lang);
  const b = r.business;
  const logo = b.branded ? logoUrl(b.logo_path) : null;
  return (
    <article className="card overflow-hidden" data-testid="receipt">
      <header className="flex items-start gap-4 border-b-2 border-brand-600 p-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo && <img src={logo} alt="" className="h-12 w-auto max-w-28 object-contain" />}
        <div className="min-w-0 text-sm">
          <p className="text-base font-bold text-ink-900">{b.name}</p>
          {[b.address, b.city, b.phone].filter(Boolean).map((l) => <p key={l} className="text-ink-500">{l}</p>)}
          {b.tax_id && <p className="text-ink-500">{fmt(d.receipt.taxId, { id: b.tax_id })}</p>}
        </div>
      </header>
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-xl font-bold tracking-wide text-brand-700 uppercase">{isInvoice(r) ? d.receipt.invoice : d.receipt.receipt}</h2>
          <div className="text-right text-sm">
            <p className="font-semibold">{d.receipt.number} {receiptNumber(r)}</p>
            <p className="text-ink-500">{formatDate(r.sale.date, lang)}</p>
          </div>
        </div>
        {r.sale.customer && <p className="text-sm">{d.receipt.customer} : <b>{r.sale.customer}</b></p>}
        <table className="w-full text-sm">
          <thead><tr className="bg-brand-50 text-left text-brand-800">
            <th className="p-2">{d.receipt.item}</th>
            <th className="hidden p-2 text-right sm:table-cell">{d.receipt.qty}</th>
            <th className="hidden p-2 text-right sm:table-cell">{d.receipt.unitPrice}</th>
            <th className="p-2 text-right">{d.receipt.amount}</th>
          </tr></thead>
          <tbody><tr className="border-b border-ink-100 align-top">
            <td className="p-2">
              <p className="break-words">{r.sale.item}</p>
              <p className="text-xs text-ink-500 sm:hidden">{formatNumber(r.sale.quantity, lang)} × {m(r.sale.unit_price)}</p>
            </td>
            <td className="hidden p-2 text-right sm:table-cell">{formatNumber(r.sale.quantity, lang)}</td>
            <td className="hidden p-2 text-right whitespace-nowrap sm:table-cell">{m(r.sale.unit_price)}</td>
            <td className="p-2 text-right whitespace-nowrap">{m(r.sale.total)}</td>
          </tr></tbody>
        </table>
        <dl className="ml-auto grid max-w-xs grid-cols-2 gap-y-1 text-sm">
          <dt className="font-semibold">{d.receipt.total}</dt><dd className="text-right font-bold">{m(r.sale.total)}</dd>
          <dt className="text-emerald-700">{d.receipt.paid}</dt><dd className="text-right text-emerald-700">{m(r.sale.paid)}</dd>
          {r.sale.remaining > 0 && <><dt className="font-semibold text-amber-700">{d.receipt.remaining}</dt><dd className="text-right font-bold text-amber-700">{m(r.sale.remaining)}</dd></>}
        </dl>
        {r.payments.length > 0 && (
          <div className="text-sm">
            <p className="mb-1 font-semibold">{d.receipt.payments}</p>
            <ul className="space-y-0.5 text-ink-600">
              {r.payments.map((p, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>{formatDate(p.date, lang)} · {d.methods[p.method as keyof typeof d.methods] ?? p.method}</span><span>{m(p.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {b.footer && <p className="border-t border-ink-100 pt-3 text-center text-sm whitespace-pre-line text-ink-700">{b.footer}</p>}
        <p className="text-center text-xs text-ink-400">{d.receipt.generatedBy}</p>
      </div>
    </article>
  );
}
