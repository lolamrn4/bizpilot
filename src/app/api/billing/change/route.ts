import { NextResponse, type NextRequest } from "next/server";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { billingConfigured, paddle, paddleEnv, PaddleError } from "@/lib/paddle";
import { PAID_PLANS, type PaidPlan } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/** Change la formule d'un abonnement existant (au prorata). Effectif seulement quand le webhook confirme. */
export async function POST(req: NextRequest) {
  const { supabase, user } = await getAppContext();
  const { d } = await getDict();
  if (!billingConfigured()) return NextResponse.json({ error: d.billing.notConfigured }, { status: 503 });
  const { plan } = (await req.json().catch(() => ({}))) as { plan?: string };
  if (!PAID_PLANS.includes(plan as PaidPlan)) return NextResponse.json({ error: d.billing.invalidPlan }, { status: 400 });
  const { data: sub } = await supabase.from("subscriptions").select("provider_subscription_id, status, plan_code").eq("user_id", user.id).single();
  if (!sub?.provider_subscription_id || !["active", "trialing", "past_due"].includes(sub.status)) {
    return NextResponse.json({ error: d.billing.noSubscription }, { status: 409 });
  }
  if (sub.plan_code === plan) return NextResponse.json({ error: d.billing.samePlan }, { status: 400 });
  const { data: price } = await supabase.from("plan_provider_prices").select("price_id")
    .eq("provider", "paddle").eq("environment", paddleEnv()).eq("plan_code", plan).maybeSingle();
  if (!price) return NextResponse.json({ error: d.billing.notConfigured }, { status: 503 });
  try {
    await paddle("PATCH", `/subscriptions/${encodeURIComponent(sub.provider_subscription_id)}`, {
      items: [{ price_id: price.price_id, quantity: 1 }],
      proration_billing_mode: "prorated_immediately",
    });
    return NextResponse.json({ ok: d.billing.changeRequested });
  } catch (e) {
    const code = e instanceof PaddleError ? e.code : "network";
    await supabase.from("error_logs").insert({ user_id: user.id, context: "billing:change", message: `${code}: ${String(e).slice(0, 200)}` });
    return NextResponse.json({ error: d.billing.providerError }, { status: 502 });
  }
}
