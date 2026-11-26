import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/i18n/server";
import { getDisplayPrices } from "@/lib/prices";
import { PAID_PLANS } from "@/lib/pricing";
import { PlanForm, PriceForm } from "../AdminForms";
import { setFlagAction } from "../actions";

export default async function AdminPlans() {
  const supabase = await createClient();
  const { d } = await getDict();
  const [{ data: plans }, { data: flags }] = await Promise.all([
    supabase.from("plans").select("code, limits, features, is_active").order("sort_order"),
    supabase.from("feature_flags").select("key, enabled").order("key"),
  ]);
  const grid = await getDisplayPrices(supabase);
  const t = d.admin.plans;
  return (
    <>
      <section className="card p-5">
        <h2 className="h2">{t.flags}</h2>
        <p className="mb-3 text-sm text-ink-500">{t.flagsIntro}</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {(flags ?? []).map((f) => (
            <li key={f.key} className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 text-sm" data-testid={`flag-${f.key}`}>
              <span>{t.featureNames[f.key as keyof typeof t.featureNames] ?? f.key} <span className={`badge ml-1 ${f.enabled ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{f.enabled ? t.on : t.off}</span></span>
              <form action={setFlagAction}><input type="hidden" name="key" value={f.key} /><input type="hidden" name="enabled" value={String(!f.enabled)} />
                <button className={f.enabled ? "btn-danger px-3 py-1 text-xs" : "btn-secondary px-3 py-1 text-xs"}>{f.enabled ? t.turnOff : t.turnOn}</button></form>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-sm text-ink-500">{t.intro}</p>
      {(plans ?? []).map((p) => (
        <section key={p.code} className="card space-y-5 p-5" data-testid={`plan-admin-${p.code}`}>
          <h2 className="text-lg font-bold">{d.plans[p.code as "free"]}</h2>
          <PlanForm plan={p.code} limits={p.limits} features={p.features} active={p.is_active} />
          {PAID_PLANS.includes(p.code as "premium") && (
            <div className="border-t border-ink-100 pt-4">
              <h3 className="mb-1 text-sm font-semibold">{t.pricing}</h3>
              <p className="mb-3 text-xs text-ink-500">{t.pricingIntro}</p>
              <PriceForm plan={p.code} prices={grid[p.code as "premium"]} />
            </div>
          )}
        </section>
      ))}
    </>
  );
}
