import { Suspense } from "react";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { billingConfigured, paddleEnv } from "@/lib/paddle";
import { BillingClient } from "./BillingClient";
import { getDisplayPrices } from "@/lib/prices";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const { supabase, business } = await getAppContext();
  const { d } = await getDict();
  const { data } = await supabase.rpc("my_billing");
  const env = paddleEnv();
  const { count } = await supabase.from("plan_provider_prices").select("plan_code", { count: "exact", head: true }).eq("environment", env);
  const configured = billingConfigured() && (count ?? 0) === 3;
  const grid = await getDisplayPrices(supabase);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="h1">{d.billing.title}</h1>
        <p className="text-sm text-ink-500">{d.billing.subtitle}</p>
      </div>
      <Suspense>
        <BillingClient grid={grid} billing={data ?? { plan: "free", effective_plan: "free", status: "active", current_period_end: null, provider: null, has_paddle: false, scheduled_change: null, scheduled_change_at: null }} businessCurrency={business.currency} configured={configured} clientToken={process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? ""} env={env} />
      </Suspense>
    </div>
  );
}
