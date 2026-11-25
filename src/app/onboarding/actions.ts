"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/i18n/server";
import { errorMessage } from "@/lib/errors";
import { isCurrency } from "@/lib/money";
import { BIZ_COOKIE } from "@/lib/session";
import type { ActionState } from "@/components/forms";

export async function createBusinessAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { d } = await getDict();
  const name = String(fd.get("name") ?? "").trim();
  const owner_name = String(fd.get("owner_name") ?? "").trim();
  const sector = String(fd.get("sector") ?? "").trim();
  const city = String(fd.get("city") ?? "").trim();
  const currency = String(fd.get("currency") ?? "");
  const timezone = String(fd.get("timezone") ?? "");
  if (!name || !owner_name || !isCurrency(currency) || !timezone) return { error: d.errors.required };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase
    .from("businesses")
    .insert({ name, owner_name, sector, city, currency, timezone, owner_id: user.id })
    .select("id")
    .single();
  if (error) return { error: errorMessage(error, d) };
  (await cookies()).set(BIZ_COOKIE, data.id, { path: "/", maxAge: 31536000, sameSite: "lax", httpOnly: true });
  redirect("/app");
}
