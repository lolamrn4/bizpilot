import { NextResponse, type NextRequest } from "next/server";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { aiEnabled, explainWithAi, validateNumbers } from "@/lib/ai";
import { forecastFacts, renderRecommendation, type ForecastPayload, type Recommendation } from "@/lib/intel-text";
import { formatMoney, formatPercent } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { supabase, business, user } = await getAppContext();
  const { d, lang } = await getDict();
  const body = (await req.json().catch(() => ({}))) as { kind?: string };
  const kind = body.kind === "forecast" || body.kind === "pricing" ? body.kind : "coach";

  // Droit + quota vérifiés en base (jamais côté navigateur).
  const { data: allowed } = await supabase.rpc("ai_quota_ok", { p_business: business.id, p_kind: kind });
  if (!allowed) return NextResponse.json({ error: d.intel.aiQuota }, { status: 429 });

  // Les faits sont recalculés côté serveur à partir de la base : on ne fait jamais confiance au navigateur.
  let facts: string[] = [];
  if (kind === "coach") {
    const { data } = await supabase.from("recommendations").select("*").eq("business_id", business.id).eq("status", "open").order("priority").limit(10);
    facts = ((data ?? []) as Recommendation[]).flatMap((r) => {
      const t = renderRecommendation(r, d, lang, business.currency);
      return t ? [`[${d.coach[`p${r.priority}` as "p1"]}] ${t.title}. ${t.problem} ${t.figure} ${d.coach.action} : ${t.action} ${t.benefit}.`] : [];
    });
    if (facts.length === 0) facts = [d.coach.empty];
  } else if (kind === "forecast") {
    const { data } = await supabase.from("forecasts").select("payload").eq("business_id", business.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!data) return NextResponse.json({ error: d.forecast.none }, { status: 400 });
    facts = forecastFacts(data.payload as ForecastPayload, d, lang);
  } else {
    const { data, error } = await supabase.rpc("pricing_analysis", { p_business: business.id });
    if (error || !data) return NextResponse.json({ error: d.common.unexpected }, { status: 400 });
    const p = data as { products: { name: string; status: string; unit_cost: number; sale_price: number; margin: number | null; suggested_price: number | null; loss_amount_90d: number | null }[] };
    facts = p.products.filter((x) => x.status === "loss" || x.status === "low").slice(0, 10).map((x) =>
      `${x.name} : ${x.status === "loss" ? d.pricing.loss : d.pricing.low}. ${d.products.unitCost} ${formatMoney(x.unit_cost, business.currency, lang)}, ${d.products.salePrice} ${formatMoney(x.sale_price, business.currency, lang)}` +
      (x.margin != null ? `, ${d.products.margin} ${formatPercent(x.margin, lang)}` : "") +
      (x.suggested_price ? `, ${d.pricing.suggested} ${formatMoney(x.suggested_price, business.currency, lang)}` : "") +
      (x.loss_amount_90d ? `, ${d.pricing.lossSales} ${formatMoney(x.loss_amount_90d, business.currency, lang)}` : ""));
    if (facts.length === 0) facts = [`${d.pricing.ok}.`];
  }

  const rulesText = facts.join("\n");
  if (!aiEnabled()) return NextResponse.json({ source: "rules", text: rulesText, rejected: false });

  try {
    const { text, usage } = await explainWithAi(kind, lang, facts);
    const check = validateNumbers(text, facts);
    await supabase.from("ai_usage").insert({
      business_id: business.id, user_id: user.id, kind, accepted: check.ok && text.length > 0,
      input_tokens: usage.input_tokens ?? null, output_tokens: usage.output_tokens ?? null,
    });
    if (!check.ok || !text) {
      await supabase.from("error_logs").insert({ user_id: user.id, context: `ai_rejected:${kind}`, message: `unknown numbers: ${check.unknown.join(", ")}` });
      return NextResponse.json({ source: "rules", text: rulesText, rejected: true });
    }
    return NextResponse.json({ source: "ai", text, rejected: false });
  } catch (e) {
    await supabase.from("error_logs").insert({ user_id: user.id, context: `ai_error:${kind}`, message: String(e).slice(0, 300) });
    return NextResponse.json({ source: "rules", text: rulesText, rejected: false, unavailable: true });
  }
}
