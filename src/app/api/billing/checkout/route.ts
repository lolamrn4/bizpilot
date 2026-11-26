import { NextResponse, type NextRequest } from "next/server";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { billingConfigured, paddle, paddleEnv, PaddleError } from "@/lib/paddle";
import { PAID_PLANS, type PaidPlan } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/** Crée côté serveur une transaction Paddle liée au compte connecté ; le navigateur ouvre ensuite le paiement Paddle. */
export async function POST(req: NextRequest) {
  const { supabase, user } = await getAppContext();
  const { d } = await getDict();
  if (!billingConfigured()) return NextResponse.json({ error: d.billing.notConfigured }, { status: 503 });
  const { plan } = (await req.json().catch(() => ({}))) as { plan?: string };
  if (!PAID_PLANS.includes(plan as PaidPlan)) return NextResponse.json({ error: d.billing.invalidPlan }, { status: 400 });

  const { data: billing } = await supabase.rpc("my_billing");
  const b = billing as { has_paddle: boolean; status: string; effective_plan: string } | null;
  if (b?.has_paddle && ["active", "trialing", "past_due"].includes(b.status)) {
    return NextResponse.json({ error: d.billing.alreadySubscribed, useChange: true }, { status: 409 });
  }
  const { data: price } = await supabase.from("plan_provider_prices").select("price_id")
    .eq("provider", "paddle").eq("environment", paddleEnv()).eq("plan_code", plan).maybeSingle();
  if (!price) return NextResponse.json({ error: d.billing.notConfigured }, { status: 503 });

  const { data: sub } = await supabase.from("subscriptions").select("provider_customer_id").eq("user_id", user.id).single();
  try {
    const txn = await paddle<{ id: string }>("POST", "/transactions", {
      items: [{ price_id: price.price_id, quantity: 1 }],
      // user_id posé par le serveur : c'est lui qui relie le paiement au bon compte dans le webhook.
      custom_data: { user_id: user.id, plan },
      ...(sub?.provider_customer_id ? { customer_id: sub.provider_customer_id } : {}),
    });
    return NextResponse.json({ transactionId: txn.id, email: sub?.provider_customer_id ? null : user.email });
  } catch (e) {
    const code = e instanceof PaddleError ? e.code : "network";
    await supabase.from("error_logs").insert({ user_id: user.id, context: "billing:checkout", message: `${code}: ${String(e).slice(0, 200)}` });
    return NextResponse.json({ error: d.billing.providerError }, { status: 502 });
  }
}
