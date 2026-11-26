import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { billingConfigured, paddle, PaddleError } from "@/lib/paddle";

export const dynamic = "force-dynamic";

/** Lien sécurisé vers l'espace client Paddle (factures, moyen de paiement, annulation). */
export async function POST() {
  const { supabase, user } = await getAppContext();
  const { d } = await getDict();
  if (!billingConfigured()) return NextResponse.json({ error: d.billing.notConfigured }, { status: 503 });
  const { data: sub } = await supabase.from("subscriptions").select("provider_customer_id, provider_subscription_id").eq("user_id", user.id).single();
  if (!sub?.provider_customer_id) return NextResponse.json({ error: d.billing.noSubscription }, { status: 409 });
  try {
    const s = await paddle<{ urls: { general: { overview: string } } }>("POST", `/customers/${encodeURIComponent(sub.provider_customer_id)}/portal-sessions`,
      sub.provider_subscription_id ? { subscription_ids: [sub.provider_subscription_id] } : {});
    return NextResponse.json({ url: s.urls.general.overview });
  } catch (e) {
    const code = e instanceof PaddleError ? e.code : "network";
    await supabase.from("error_logs").insert({ user_id: user.id, context: "billing:portal", message: `${code}: ${String(e).slice(0, 200)}` });
    return NextResponse.json({ error: d.billing.providerError }, { status: 502 });
  }
}
