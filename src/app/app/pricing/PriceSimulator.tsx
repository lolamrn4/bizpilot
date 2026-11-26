"use client";
import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { Field } from "@/components/forms";
import { DECIMALS, formatMoney, formatPercent, parseAmount, pricing, type Currency } from "@/lib/money";

type P = { id: string; name: string; unit_cost: number; sale_price: number };

/** Simulateur déterministe : prix ⇄ marge ⇄ majoration. Arrondi au supérieur selon la devise. */
export function PriceSimulator({ products, currency, targetMargin }: { products: P[]; currency: string; targetMargin: number }) {
  const { d, lang } = useI18n();
  const dec = DECIMALS[currency as Currency] ?? 2;
  const ceil = (v: number) => Math.ceil(v * 10 ** dec - 1e-9) / 10 ** dec;
  const [cost, setCost] = useState(products[0] ? String(products[0].unit_cost) : "");
  const [mode, setMode] = useState<"margin" | "markup" | "price">("margin");
  const [pct, setPct] = useState(String(Math.round(targetMargin * 1000) / 10));
  const [price, setPrice] = useState(products[0] ? String(products[0].sale_price) : "");
  const c = parseAmount(cost) ?? 0;
  const p = parseAmount(pct) ?? 0;
  let salePrice: number | null = null;
  let err = "";
  if (mode === "margin") { if (p >= 100) err = d.pricing.marginTooHigh; else salePrice = ceil(c / (1 - p / 100)); }
  else if (mode === "markup") salePrice = ceil(c * (1 + p / 100));
  else salePrice = parseAmount(price) ?? 0;
  const r = salePrice !== null ? pricing(c, salePrice) : null;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={d.pricing.simProduct}>
          <select className="input" onChange={(e) => { const x = products.find((q) => q.id === e.target.value); if (x) { setCost(String(x.unit_cost)); setPrice(String(x.sale_price)); } }}>
            {products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            <option value="">{d.pricing.simManual}</option>
          </select>
        </Field>
        <Field label={`${d.pricing.simCost} (${currency})`}><input className="input" type="number" min="0" step="any" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} /></Field>
        <Field label={d.pricing.simMode}>
          <select className="input" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
            <option value="margin">{d.pricing.simByMargin}</option>
            <option value="markup">{d.pricing.simByMarkup}</option>
            <option value="price">{d.pricing.simByPrice}</option>
          </select>
        </Field>
        {mode === "price" ? (
          <Field label={`${d.pricing.simPrice} (${currency})`}><input className="input" type="number" min="0" step="any" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        ) : (
          <Field label={mode === "margin" ? d.pricing.simMarginPct : d.pricing.simMarkupPct}><input className="input" type="number" min="0" step="any" inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} /></Field>
        )}
      </div>
      {err && <p className="alert-error">{err}</p>}
      {r && salePrice !== null && (
        <div className="rounded-2xl bg-brand-50 p-4">
          <p className="text-xs font-semibold tracking-wide text-brand-700 uppercase">{d.pricing.simResult}</p>
          <dl className="mt-2 grid grid-cols-2 gap-y-1.5 text-sm sm:grid-cols-4">
            <div><dt className="text-ink-500">{d.pricing.simPrice}</dt><dd className="text-lg font-extrabold text-brand-800" data-testid="sim-price">{formatMoney(salePrice, currency, lang)}</dd></div>
            <div><dt className="text-ink-500">{d.products.profitPerUnit}</dt><dd className={`text-lg font-bold ${r.profit < 0 ? "text-red-700" : "text-emerald-700"}`}>{formatMoney(r.profit, currency, lang)}</dd></div>
            <div><dt className="text-ink-500">{d.products.margin}</dt><dd className="text-lg font-bold" data-testid="sim-margin">{r.margin === null ? "—" : formatPercent(r.margin, lang)}</dd></div>
            <div><dt className="text-ink-500">{d.products.markup}</dt><dd className="text-lg font-bold" data-testid="sim-markup">{r.markup === null ? "—" : formatPercent(r.markup, lang)}</dd></div>
          </dl>
          {r.loss && salePrice > 0 && <p className="alert-error mt-3">{d.products.lossAlert}</p>}
        </div>
      )}
      <p className="hint">{d.pricing.simExample}</p>
    </div>
  );
}
