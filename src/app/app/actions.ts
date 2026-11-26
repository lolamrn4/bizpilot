"use server";
import { revalidatePath } from "next/cache";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { errorMessage } from "@/lib/errors";
import { fmt } from "@/i18n";
import type { ActionState } from "@/components/forms";

export async function runForecastAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, business } = await getAppContext();
  const { d } = await getDict();
  const h = Number(fd.get("horizon"));
  const { error } = await supabase.rpc("generate_forecast", { p_business: business.id, p_horizon: h });
  if (error) return { error: errorMessage(error, d) };
  revalidatePath("/app/forecast");
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function runCoachAction(_prev: ActionState): Promise<ActionState> {
  const { supabase, business } = await getAppContext();
  const { d } = await getDict();
  const { data, error } = await supabase.rpc("run_coach", { p_business: business.id });
  if (error) return { error: errorMessage(error, d) };
  revalidatePath("/app/coach");
  const r = data as { status: string; history_days: number; min_days?: number };
  if (r.status === "insufficient_data") return { error: fmt(d.coach.insufficient, { have: r.history_days, min: r.min_days ?? 7 }) };
  return undefined;
}

export async function setRecStatusAction(fd: FormData) {
  const { supabase } = await getAppContext();
  await supabase.rpc("set_recommendation_status", { p_id: String(fd.get("id")), p_status: String(fd.get("status")) });
  revalidatePath("/app/coach");
}
