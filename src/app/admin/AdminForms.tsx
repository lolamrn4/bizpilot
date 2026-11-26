"use client";
import { useActionState, useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { ActionForm, Field, FormMessage, SubmitButton } from "@/components/forms";
import { changePriceAction, setupPaddlePricesAction, setUserPlanAction, updatePlanAction } from "./actions";

export function SetupPricesForm({ disabled }: { disabled: boolean }) {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(setupPaddlePricesAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-2">
      <FormMessage state={state} />
      {disabled ? <button className="btn-primary" disabled>{d.admin.createPrices}</button> : <SubmitButton>{d.admin.createPrices}</SubmitButton>}
    </ActionForm>
  );
}

export function UserPlanForm({ userId, locked }: { userId: string; locked: boolean }) {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(setUserPlanAction, undefined);
  const [plan, setPlan] = useState("premium");
  if (locked) return <p className="text-xs text-ink-500">{d.admin.users.paddleLocked}</p>;
  return (
    <ActionForm action={action} pending={pending} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <label className="text-xs"><span className="mb-1 block text-ink-500">{d.admin.users.grantPlan}</span>
        <select name="plan" className="input py-1.5 text-sm" value={plan} onChange={(e) => setPlan(e.target.value)}>
          <option value="standard">{d.plans.standard}</option><option value="premium">{d.plans.premium}</option>
          <option value="business">{d.plans.business}</option><option value="free">{d.admin.users.backToFree}</option>
        </select></label>
      {plan !== "free" && <label className="text-xs"><span className="mb-1 block text-ink-500">{d.admin.users.grantDays}</span><input name="days" type="number" min={1} max={365} defaultValue={7} className="input w-24 py-1.5 text-sm" /></label>}
      <SubmitButton className="btn-secondary px-3 py-1.5 text-sm">{d.admin.users.grantBtn}</SubmitButton>
      <div className="w-full"><FormMessage state={state} /></div>
    </ActionForm>
  );
}

const LIMITS = ["max_businesses", "max_users", "max_sales_month", "max_expenses_month", "max_products"] as const;
const FEATURES = ["all_periods", "partial_payments", "low_stock_alerts", "exports", "receipts", "smart_pricing_full", "forecast", "coach", "full_history", "multi_business", "roles", "comparative_reports", "priority_support", "custom_receipts"] as const;

export function PlanForm({ plan, limits, features, active }: { plan: string; limits: Record<string, number>; features: string[]; active: boolean }) {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(updatePlanAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-4">
      <input type="hidden" name="plan" value={plan} />
      <FormMessage state={state} />
      <div>
        <p className="label">{d.admin.plans.limits}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {LIMITS.map((k) => (
            <label key={k} className="text-xs"><span className="mb-1 block text-ink-500">{d.admin.plans.limitNames[k]}</span>
              <input name={k} type="number" min={0} step={1} defaultValue={limits[k] ?? ""} placeholder="∞" className="input py-1.5 text-sm" data-testid={`${plan}-${k}`} /></label>
          ))}
        </div>
      </div>
      <div>
        <p className="label">{d.admin.plans.features}</p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <label key={f} className="flex items-center gap-2 text-sm"><input type="checkbox" name="features" value={f} defaultChecked={features.includes(f)} className="size-4 accent-brand-600" />{d.admin.plans.featureNames[f]}</label>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={active} disabled={plan === "free"} className="size-4 accent-brand-600" />{d.admin.plans.active}</label>
      {plan === "free" && <input type="hidden" name="is_active" value="on" />}
      <SubmitButton className="btn-secondary">{d.admin.plans.save}</SubmitButton>
    </ActionForm>
  );
}

export function PriceForm({ plan, prices }: { plan: string; prices: Record<string, number | null> }) {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(changePriceAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-3">
      <input type="hidden" name="plan" value={plan} />
      <FormMessage state={state} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {["USD", "EUR", "GBP", "GNF", "XOF"].map((c) => (
          <Field key={c} label={c}><input name={c} type="number" min={0} step="any" defaultValue={prices[c] ?? ""} required className="input py-1.5 text-sm" data-testid={`${plan}-price-${c}`} /></Field>
        ))}
      </div>
      <button
        type="submit"
        className="btn-secondary"
        disabled={pending}
        onClick={(e) => { if (!window.confirm(fmt(d.admin.plans.confirmPrice, { plan: d.plans[plan as "premium"] }))) e.preventDefault(); }}
      >
        {pending ? d.common.saving : d.admin.plans.newPrice}
      </button>
    </ActionForm>
  );
}
