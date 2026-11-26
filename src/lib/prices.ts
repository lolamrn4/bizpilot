import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PRICE_GRID, PAID_PLANS, type PaidPlan } from "@/lib/pricing";

export type Grid = Record<PaidPlan, Record<string, number | null>>;

/** Prix affichés : ceux réglés par l'admin en base, sinon la grille validée par défaut. */
export async function getDisplayPrices(supabase: SupabaseClient): Promise<Grid> {
  const grid = JSON.parse(JSON.stringify(PRICE_GRID)) as Grid;
  const { data } = await supabase.from("plan_display_prices").select("plan_code, currency, amount");
  for (const r of data ?? []) {
    if (PAID_PLANS.includes(r.plan_code as PaidPlan)) grid[r.plan_code as PaidPlan][r.currency] = Number(r.amount);
  }
  return grid;
}
