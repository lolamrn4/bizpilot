"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { isLang, LANG_COOKIE } from "@/i18n";
import { isCurrency } from "@/lib/money";
import { errorMessage } from "@/lib/errors";
import type { ActionState } from "@/components/forms";

export async function updateProfileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await getAppContext();
  const full_name = String(fd.get("full_name") ?? "").trim().slice(0, 120);
  const language = String(fd.get("language") ?? "fr");
  if (!isLang(language)) return { error: (await getDict()).d.errors.required };
  const { error } = await supabase.from("profiles").update({ full_name, language }).eq("id", user.id);
  (await cookies()).set(LANG_COOKIE, language, { path: "/", maxAge: 31536000, sameSite: "lax" });
  const { d } = await getDict();
  if (error) return { error: errorMessage(error, d) };
  revalidatePath("/", "layout");
  return { ok: d.common.saved };
}

export async function updateBusinessAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, business } = await getAppContext();
  const { d } = await getDict();
  const name = String(fd.get("name") ?? "").trim();
  const owner_name = String(fd.get("owner_name") ?? "").trim();
  const currency = String(fd.get("currency") ?? business.currency);
  const timezone = String(fd.get("timezone") ?? "");
  if (!name || !owner_name || !isCurrency(currency) || !timezone) return { error: d.errors.required };
  const { error } = await supabase
    .from("businesses")
    .update({ name, owner_name, sector: String(fd.get("sector") ?? "").trim(), city: String(fd.get("city") ?? "").trim(), currency, timezone })
    .eq("id", business.id);
  if (error) return { error: errorMessage(error, d) };
  revalidatePath("/app", "layout");
  return { ok: d.common.saved };
}

export async function changePasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await getAppContext();
  const { d } = await getDict();
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: d.auth.errWeak };
  if (password !== String(fd.get("confirm") ?? "")) return { error: d.auth.errMismatch };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.code === "weak_password" ? d.auth.errWeak : d.common.unexpected };
  return { ok: d.auth.resetDone };
}
