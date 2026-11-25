"use client";
import { useActionState, useMemo, useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { ActionForm, Field, FormMessage, LockNote, SubmitButton } from "@/components/forms";
import { DECIMALS, formatMoney, formatNumber, parseAmount, type Currency } from "@/lib/money";
import { PAYMENT_METHODS, type Sale } from "@/lib/types";
import { addPaymentAction, createSaleAction, updateSaleAction } from "./actions";

type ProductOpt = { id: string; name: string; sale_price: number; stock_quantity: number };

export function SaleForm({ products, currency, today, sale, partialAllowed }: { products: ProductOpt[]; currency: string; today: string; sale?: Sale; partialAllowed: boolean }) {
  const { d, lang } = useI18n();
  const [state, action, pending] = useActionState(sale ? updateSaleAction : createSaleAction, undefined);
  const [productId, setProductId] = useState(sale?.product_id ?? (sale ? "" : products[0]?.id ?? ""));
  const [qty, setQty] = useState(sale ? String(sale.quantity) : "1");
  const [price, setPrice] = useState(sale ? String(sale.unit_price) : String(products[0]?.sale_price ?? ""));
  const [status, setStatus] = useState<"paid" | "partial" | "pending">("paid");
  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const total = Math.round((parseAmount(qty) ?? 0) * (parseAmount(price) ?? 0) * 100) / 100;
  const step = DECIMALS[currency as Currency] === 0 ? "1" : "0.01";
  return (
    <ActionForm action={action} pending={pending} className="space-y-4">
      <FormMessage state={state} />
      {sale && <input type="hidden" name="id" value={sale.id} />}
      <Field label={d.sales.product}>
        <select
          className="input"
          name="product_id"
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value);
            const p = products.find((x) => x.id === e.target.value);
            if (p) setPrice(String(p.sale_price));
          }}
        >
          <option value="">{d.sales.noProduct}</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {product && <span className="hint block">{fmt(d.sales.inStock, { n: formatNumber(product.stock_quantity, lang) })} · {d.sales.stockNote}</span>}
      </Field>
      {!productId && <Field label={d.sales.itemName}><input className="input" name="item_name" defaultValue={sale?.item_name} required maxLength={120} /></Field>}
      {productId && <input type="hidden" name="item_name" value={sale?.product_id === productId ? sale.item_name : product?.name ?? ""} />}
      <div className="grid grid-cols-2 gap-3">
        <Field label={d.sales.quantity}><input className="input" name="quantity" type="number" min="0.001" step="any" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} required /></Field>
        <Field label={`${d.sales.unitPrice} (${currency})`}><input className="input" name="unit_price" type="number" min="0" step={step} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} required /></Field>
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-3">
        <span className="text-sm font-medium text-brand-900">{d.common.total}</span>
        <span className="text-xl font-extrabold text-brand-800">{formatMoney(total, currency, lang)}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={d.common.date}><input className="input" name="sale_date" type="date" defaultValue={sale?.sale_date ?? today} required /></Field>
        <Field label={d.sales.customer} optional><input className="input" name="customer_name" defaultValue={sale?.customer_name} maxLength={120} /></Field>
        <Field label={d.sales.paymentMethod}>
          <select className="input" name="payment_method" defaultValue={sale?.payment_method ?? "cash"}>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{d.methods[m]}</option>)}
          </select>
        </Field>
        {!sale && (
          <Field label={d.sales.status}>
            <select className="input" name="status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="paid">{d.sales.paid}</option>
              <option value="partial" disabled={!partialAllowed}>{d.sales.partial}{!partialAllowed ? " 🔒" : ""}</option>
              <option value="pending">{d.sales.pending}</option>
            </select>
          </Field>
        )}
      </div>
      {!sale && status === "partial" && (
        <Field label={`${d.sales.amountPaid} (${currency})`}><input className="input" name="amount_paid" type="number" min="0" step={step} max={total} inputMode="decimal" required /></Field>
      )}
      {!sale && !partialAllowed && <LockNote text={d.sales.partialLocked} />}
      <Field label={d.common.note} optional><textarea className="input" name="note" rows={2} defaultValue={sale?.note} maxLength={500} /></Field>
      <SubmitButton className="btn-primary w-full sm:w-auto">{d.common.save}</SubmitButton>
    </ActionForm>
  );
}

export function PaymentForm({ saleId, remaining, currency, today, partialAllowed }: { saleId: string; remaining: number; currency: string; today: string; partialAllowed: boolean }) {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(addPaymentAction, undefined);
  const step = DECIMALS[currency as Currency] === 0 ? "1" : "0.01";
  return (
    <ActionForm action={action} pending={pending} className="space-y-3">
      <FormMessage state={state} />
      <input type="hidden" name="sale_id" value={saleId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={`${d.common.amount} (${currency})`}>
          <input className="input" name="amount" type="number" min="0" step={step} max={remaining} defaultValue={remaining} readOnly={!partialAllowed} inputMode="decimal" required />
        </Field>
        <Field label={d.common.date}><input className="input" name="paid_on" type="date" defaultValue={today} required /></Field>
        <Field label={d.sales.paymentMethod}>
          <select className="input" name="method" defaultValue="cash">{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{d.methods[m]}</option>)}</select>
        </Field>
      </div>
      {!partialAllowed && <LockNote text={d.sales.partialLocked} />}
      <SubmitButton className="btn-secondary">{d.sales.addPayment}</SubmitButton>
    </ActionForm>
  );
}
