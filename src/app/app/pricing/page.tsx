import Link from "next/link";
import { requireManager } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { formatMoney, formatNumber, formatPercent } from "@/lib/money";
import { errorMessage } from "@/lib/errors";
import { LockNote } from "@/components/forms";
import { AiExplain } from "@/components/AiExplain";
import { aiEnabled } from "@/lib/ai";
import { PriceSimulator } from "./PriceSimulator";

type Row = {
  id: string; name: string; unit_cost: number; sale_price: number; profit: number; margin: number | null; markup: number | null;
  status: "loss" | "low" | "ok" | "no_price"; target_margin: number; suggested_price: number | null;
  units_90d: number | null; avg_price_90d: number | null; actual_margin_90d: number | null; loss_amount_90d: number | null;
};
type Analysis = { full: boolean; currency: string; target_margin: number; min_margin: number; loss_amount_90d: number | null; counts: Record<string, number>; products: Row[] };

export default async function PricingPage() {
  const { supabase, business, entitlements } = await requireManager();
  const { d, lang } = await getDict();
  const { data, error } = await supabase.rpc("pricing_analysis", { p_business: business.id });
  const a = data as Analysis | null;
  const m = (v: number | null) => (v == null ? "—" : formatMoney(v, business.currency, lang));
  const pc = (v: number | null) => (v == null ? "—" : formatPercent(v, lang));
  const badge = { loss: "bg-red-50 text-red-700", low: "bg-amber-50 text-amber-800", ok: "bg-emerald-50 text-emerald-700", no_price: "bg-ink-100 text-ink-600" };
  const label = { loss: d.pricing.loss, low: d.pricing.low, ok: d.pricing.ok, no_price: d.pricing.noPrice };
  return (
    <div className="space-y-5">
      <div>
        <h1 className="h1">{d.pricing.title}</h1>
        <p className="text-sm text-ink-500">{d.pricing.subtitle}</p>
      </div>
      {error && <p className="alert-error">{errorMessage(error, d)}</p>}
      {a && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["loss", "low", "ok", "no_price"] as const).map((k) => (
              <div key={k} className="card p-4"><p className="text-xs text-ink-500">{label[k]}</p><p className={`text-2xl font-bold ${k === "loss" ? "text-red-700" : k === "low" ? "text-amber-700" : ""}`}>{a.counts[k]}</p></div>
            ))}
          </div>
          {a.full ? (
            a.loss_amount_90d! > 0 && <p className="alert-error">{d.pricing.lossTotal} : <b>{m(a.loss_amount_90d)}</b></p>
          ) : <LockNote text={d.intel.lockedPricing} />}
          <AiExplain kind="pricing" enabled={aiEnabled() && a.full && entitlements.ai_enabled !== false} />
          {a.products.length === 0 ? (
            <div className="card p-8 text-center text-sm text-ink-600">{d.pricing.emptyProducts} <Link href="/app/products/new" className="font-semibold text-brand-700">{d.products.new}</Link></div>
          ) : (
            <div className="space-y-3">
              {a.products.map((p) => (
                <Link key={p.id} href={`/app/products/${p.id}`} className="card block p-4 transition hover:border-brand-200" data-testid="pricing-row">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{p.name}</p>
                    <span className={`badge ${badge[p.status]}`}>{label[p.status]}</span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
                    <div><dt className="text-xs text-ink-500">{d.products.unitCost}</dt><dd className="font-semibold">{m(p.unit_cost)}</dd></div>
                    <div><dt className="text-xs text-ink-500">{d.products.salePrice}</dt><dd className="font-semibold">{m(p.sale_price)}</dd></div>
                    <div><dt className="text-xs text-ink-500">{d.products.margin}</dt><dd className="font-semibold">{pc(p.margin)}</dd></div>
                    <div><dt className="text-xs text-ink-500">{d.products.markup}</dt><dd className="font-semibold">{pc(p.markup)}</dd></div>
                    {a.full && <>
                      <div><dt className="text-xs text-ink-500">{d.pricing.suggested} ({pc(p.target_margin)})</dt><dd className="font-bold text-brand-700">{m(p.suggested_price)}</dd></div>
                      <div><dt className="text-xs text-ink-500">{d.pricing.sold90}</dt><dd className="font-semibold">{formatNumber(p.units_90d, lang)}</dd></div>
                      <div><dt className="text-xs text-ink-500">{d.pricing.actualMargin}</dt><dd className="font-semibold">{pc(p.actual_margin_90d)}</dd></div>
                      <div><dt className="text-xs text-ink-500">{d.pricing.lossSales}</dt><dd className={`font-semibold ${p.loss_amount_90d ? "text-red-700" : ""}`}>{m(p.loss_amount_90d)}</dd></div>
                    </>}
                  </dl>
                </Link>
              ))}
            </div>
          )}
          <section className="card p-5">
            <h2 className="h2 mb-4">{d.pricing.simTitle}</h2>
            <PriceSimulator products={a.products.map((p) => ({ id: p.id, name: p.name, unit_cost: Number(p.unit_cost), sale_price: Number(p.sale_price) }))} currency={business.currency} targetMargin={Number(a.target_margin)} />
          </section>
          <p className="text-xs text-ink-400">{d.products.marginHelp} {d.intel.aiDisclaimer}</p>
        </>
      )}
    </div>
  );
}
