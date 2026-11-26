"use server";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/i18n/server";
import { errorMessage } from "@/lib/errors";
import { parseAmount } from "@/lib/money";
import { billingStatus, paddle, paddleEnv, PaddleError } from "@/lib/paddle";
import { getDisplayPrices } from "@/lib/prices";
import { EURO_COUNTRIES, PAID_PLANS, type PaidPlan } from "@/lib/pricing";
import type { ActionState } from "@/components/forms";

/** Chaque action revérifie le statut admin ; la base le revérifie encore (assert_admin). */
async function admin() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) notFound();
  return supabase;
}

const cents = (v: number) => String(Math.round(v * 100));
const planName = (p: string) => `Biz Pilot Digital — ${p[0].toUpperCase()}${p.slice(1)}`;

async function createPaddlePrice(plan: PaidPlan, amounts: Record<string, number | null>, productId?: string) {
  const product = productId ?? (await paddle<{ id: string }>("POST", "/products", { name: planName(plan), tax_category: "standard", description: planName(plan) })).id;
  const price = await paddle<{ id: string }>("POST", "/prices", {
    product_id: product,
    name: `${planName(plan)} (mensuel)`,
    description: `${planName(plan)} — abonnement mensuel`,
    billing_cycle: { interval: "month", frequency: 1 },
    unit_price: { amount: cents(amounts.USD!), currency_code: "USD" },
    unit_price_overrides: [
      ...(amounts.EUR ? [{ country_codes: EURO_COUNTRIES, unit_price: { amount: cents(amounts.EUR), currency_code: "EUR" } }] : []),
      ...(amounts.GBP ? [{ country_codes: ["GB"], unit_price: { amount: cents(amounts.GBP), currency_code: "GBP" } }] : []),
    ],
    quantity: { minimum: 1, maximum: 1 },
  });
  return price.id;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function setupPaddlePricesAction(_prev: ActionState): Promise<ActionState> {
  const supabase = await admin();
  const { d } = await getDict();
  if (!billingStatus().apiKey) return { error: d.admin.missingConfig };
  const env = paddleEnv();
  const grid = await getDisplayPrices(supabase);
  const { data: existing } = await supabase.from("plan_provider_prices").select("plan_code").eq("environment", env);
  const done = new Set((existing ?? []).map((r) => r.plan_code));
  try {
    for (const plan of PAID_PLANS) {
      if (done.has(plan)) continue;
      const priceId = await createPaddlePrice(plan, grid[plan]);
      const { error } = await supabase.rpc("admin_set_prices", { p_plan: plan, p_environment: env, p_price_id: priceId, p_amounts: {} });
      if (error) return { error: errorMessage(error, d) };
    }
  } catch (e) {
    return { error: `${d.billing.providerError} (${e instanceof PaddleError ? e.code : "network"})` };
  }
  revalidatePath("/admin", "layout");
  return { ok: d.admin.pricesCreated };
}

export async function changePriceAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await admin();
  const { d } = await getDict();
  const plan = String(fd.get("plan")) as PaidPlan;
  if (!PAID_PLANS.includes(plan)) return { error: d.errors.BP094 };
  const amounts: Record<string, number> = {};
  for (const c of ["USD", "EUR", "GBP", "GNF", "XOF"]) {
    const v = parseAmount(fd.get(c));
    if (v === null || v < 0) return { error: d.errors.BP099 };
    amounts[c] = v;
  }
  if (amounts.USD <= 0) return { error: d.errors.BP099 };
  const env = paddleEnv();
  let priceId: string | null = null;
  if (billingStatus().apiKey) {
    try {
      const { data: cur } = await supabase.from("plan_provider_prices").select("price_id").eq("environment", env).eq("plan_code", plan).maybeSingle();
      let productId: string | undefined;
      if (cur?.price_id) productId = (await paddle<{ product_id: string }>("GET", `/prices/${encodeURIComponent(cur.price_id)}`)).product_id;
      priceId = await createPaddlePrice(plan, amounts, productId);
    } catch (e) {
      return { error: `${d.billing.providerError} (${e instanceof PaddleError ? e.code : "network"})` };
    }
  }
  const { error } = await supabase.rpc("admin_set_prices", { p_plan: plan, p_environment: env, p_price_id: priceId, p_amounts: amounts });
  if (error) return { error: errorMessage(error, d) };
  revalidatePath("/admin", "layout");
  return { ok: priceId ? d.admin.plans.priceSaved : d.admin.plans.priceDisplayOnly };
}

export async function setUserPlanAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await admin();
  const { d } = await getDict();
  const plan = String(fd.get("plan"));
  const days = plan === "free" ? null : Number(fd.get("days"));
  const { error } = await supabase.rpc("admin_set_user_plan", { p_user: String(fd.get("user_id")), p_plan: plan, p_days: days });
  if (error) return { error: errorMessage(error, d) };
  revalidatePath("/admin/users");
  return { ok: d.admin.users.grantDone };
}

export async function updatePlanAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await admin();
  const { d } = await getDict();
  const plan = String(fd.get("plan"));
  const limits: Record<string, number> = {};
  for (const k of ["max_businesses", "max_users", "max_sales_month", "max_expenses_month", "max_products"]) {
    const raw = String(fd.get(k) ?? "").trim();
    if (raw === "") continue;  // vide = illimité
    const v = Number(raw);
    if (!Number.isInteger(v) || v < 0) return { error: d.errors.BP099 };
    limits[k] = v;
  }
  const features = fd.getAll("features").map(String);
  const { error } = await supabase.rpc("admin_update_plan", { p_plan: plan, p_limits: limits, p_features: features, p_active: fd.get("is_active") === "on" });
  if (error) return { error: errorMessage(error, d) };
  revalidatePath("/admin/plans");
  return { ok: d.admin.plans.saved };
}

export async function setFlagAction(fd: FormData) {
  const supabase = await admin();
  await supabase.rpc("admin_set_flag", { p_key: String(fd.get("key")), p_enabled: fd.get("enabled") === "true" });
  revalidatePath("/admin/plans");
}
