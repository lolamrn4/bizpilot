"use client";
import { useActionState, useState } from "react";
import { useI18n } from "@/i18n/client";
import { ActionForm, Field, FormMessage, SubmitButton } from "@/components/forms";
import { DECIMALS, formatMoney, formatPercent, parseAmount, pricing, type Currency } from "@/lib/money";
import type { Product } from "@/lib/types";
import { addMovementAction, createProductAction, updateProductAction } from "./actions";

const COST_KEYS = ["purchase_price", "transport_cost", "packaging_cost", "delivery_cost", "transaction_fee", "other_cost"] as const;

export function ProductForm({ product, currency }: { product?: Product; currency: string }) {
  const { d, lang } = useI18n();
  const [state, action, pending] = useActionState(product ? updateProductAction : createProductAction, undefined);
  const init = (k: keyof Product) => (product ? String(product[k] ?? "") : "");
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries([...COST_KEYS, "sale_price"].map((k) => [k, init(k as keyof Product)])),
  );
  const num = (k: string) => parseAmount(vals[k]) ?? 0;
  const unitCost = COST_KEYS.reduce((s, k) => s + num(k), 0);
  const sale = num("sale_price");
  const pr = pricing(unitCost, sale);
  const step = DECIMALS[currency as Currency] === 0 ? "1" : "0.01";
  const labels: Record<(typeof COST_KEYS)[number], string> = {
    purchase_price: d.products.purchasePrice, transport_cost: d.products.transport, packaging_cost: d.products.packaging,
    delivery_cost: d.products.delivery, transaction_fee: d.products.transactionFee, other_cost: d.products.otherCost,
  };
  const moneyInput = (k: string) => (
    <input className="input" name={k} inputMode="decimal" type="number" min="0" step={step} value={vals[k]} onChange={(e) => setVals((v) => ({ ...v, [k]: e.target.value }))} placeholder="0" />
  );
  return (
    <ActionForm action={action} pending={pending} className="space-y-5">
      <FormMessage state={state} />
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3"><Field label={d.products.name}><input className="input" name="name" defaultValue={product?.name} required maxLength={120} /></Field></div>
        <Field label={d.products.category} optional><input className="input" name="category" defaultValue={product?.category} maxLength={80} /></Field>
        <Field label={d.products.sku} optional><input className="input" name="sku" defaultValue={product?.sku} maxLength={60} /></Field>
      </div>

      <fieldset className="rounded-2xl border border-ink-100 p-4">
        <legend className="px-1 text-sm font-semibold text-ink-800">{d.products.costs} ({currency})</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {COST_KEYS.map((k) => <Field key={k} label={labels[k]}>{moneyInput(k)}</Field>)}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`${d.products.salePrice} (${currency})`}>{moneyInput("sale_price")}</Field>
        <div className="rounded-2xl bg-ink-50 p-4 text-sm">
          <dl className="grid grid-cols-2 gap-y-1.5">
            <dt className="text-ink-500">{d.products.unitCost}</dt><dd className="text-right font-semibold">{formatMoney(unitCost, currency, lang)}</dd>
            <dt className="text-ink-500">{d.products.profitPerUnit}</dt><dd className={`text-right font-semibold ${pr.profit < 0 ? "text-red-700" : "text-emerald-700"}`}>{formatMoney(pr.profit, currency, lang)}</dd>
            <dt className="text-ink-500">{d.products.margin}</dt><dd className="text-right font-semibold">{pr.margin === null ? "—" : formatPercent(pr.margin, lang)}</dd>
            <dt className="text-ink-500">{d.products.markup}</dt><dd className="text-right font-semibold">{pr.markup === null ? "—" : formatPercent(pr.markup, lang)}</dd>
          </dl>
          <p className="mt-2 text-[11px] text-ink-500">{d.products.marginHelp}</p>
        </div>
      </div>
      {sale > 0 && pr.loss && <p className="alert-error">{d.products.lossAlert}</p>}
      {sale > 0 && !pr.loss && pr.margin !== null && pr.margin < 0.1 && <p className="alert-warn">{d.products.lowMarginAlert}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {!product && <Field label={d.products.initialStock}><input className="input" name="stock_quantity" type="number" inputMode="decimal" min="0" step="any" placeholder="0" /></Field>}
        <Field label={d.products.threshold} hint={d.products.thresholdHint}><input className="input" name="low_stock_threshold" type="number" inputMode="decimal" min="0" step="any" defaultValue={product?.low_stock_threshold ?? ""} placeholder="0" /></Field>
      </div>
      <SubmitButton className="btn-primary w-full sm:w-auto">{d.common.save}</SubmitButton>
    </ActionForm>
  );
}

export function MovementForm({ productId }: { productId: string }) {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(addMovementAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-3">
      <FormMessage state={state} />
      <input type="hidden" name="product_id" value={productId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={d.common.filter}>
          <select className="input" name="kind" defaultValue="restock">
            <option value="restock">{d.products.restock}</option>
            <option value="adjustment">{d.products.adjustment}</option>
          </select>
        </Field>
        <Field label={d.products.movementQty}><input className="input" name="quantity" type="number" step="any" inputMode="decimal" required /></Field>
        <Field label={d.common.note} optional><input className="input" name="note" maxLength={300} /></Field>
      </div>
      <p className="hint">{d.products.movementQtyHint}</p>
      <SubmitButton className="btn-secondary">{d.common.add}</SubmitButton>
    </ActionForm>
  );
}
