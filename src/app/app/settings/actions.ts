"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { isLang, LANG_COOKIE } from "@/i18n";
import { isCurrency, parseAmount } from "@/lib/money";
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
  const tm = parseAmount(fd.get("target_margin"));
  const mm = parseAmount(fd.get("min_margin"));
  if (tm === null || mm === null || tm < 0 || tm >= 95 || mm < 0 || mm >= 95) return { error: d.errors.number };
  const ob = parseAmount(fd.get("cash_opening_balance"));
  const od = String(fd.get("cash_opening_date") ?? "");
  const opening = ob !== null && /^\d{4}-\d{2}-\d{2}$/.test(od) ? { cash_opening_balance: ob, cash_opening_date: od } : { cash_opening_balance: null, cash_opening_date: null };
  const { error } = await supabase
    .from("businesses")
    .update({
      name, owner_name, sector: String(fd.get("sector") ?? "").trim(), city: String(fd.get("city") ?? "").trim(), currency, timezone,
      target_margin: tm / 100, min_margin: mm / 100, ...opening,
    })
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

/** Coordonnées et personnalisation du reçu (propriétaire). Le pied de page est vérifié par la base (formules payantes). */
export async function updateReceiptAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, business, isOwner, entitlements } = await getAppContext();
  const { d } = await getDict();
  if (!isOwner) return { error: d.errors.BP070 };
  const clean = (k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
  const row: Record<string, string> = { phone: clean("phone", 40), address: clean("address", 200), tax_id: clean("tax_id", 60) };
  const branded = entitlements.features.includes("custom_receipts");
  if (branded) row.receipt_footer = clean("receipt_footer", 300);
  const { error } = await supabase.from("businesses").update(row).eq("id", business.id);
  if (error) return { error: errorMessage(error, d) };

  const logo = fd.get("logo");
  if (branded && logo instanceof File && logo.size > 0) {
    if (logo.size > 1024 * 1024) return { error: d.receipt.logoTooBig };
    const bytes = new Uint8Array(await logo.arrayBuffer());
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (!isPng && !isJpg) return { error: d.receipt.logoType };
    // Nouveau nom à chaque envoi : évite qu'un ancien logo reste en cache chez les clients.
    const path = `${business.id}/logo-${Date.now()}.${isPng ? "png" : "jpg"}`;
    const up = await supabase.storage.from("logos").upload(path, bytes, { contentType: isPng ? "image/png" : "image/jpeg", upsert: false });
    if (up.error) return { error: d.common.unexpected };
    const { error: e2 } = await supabase.rpc("set_business_logo", { p_business: business.id, p_path: path });
    if (e2) return { error: errorMessage(e2, d) };
    if (business.logo_path) await supabase.storage.from("logos").remove([business.logo_path]);
  }
  revalidatePath("/app", "layout");
  return { ok: d.common.saved };
}

export async function removeLogoAction() {
  const { supabase, business, isOwner } = await getAppContext();
  if (!isOwner || !business.logo_path) return;
  await supabase.rpc("set_business_logo", { p_business: business.id, p_path: null });
  await supabase.storage.from("logos").remove([business.logo_path]);
  revalidatePath("/app", "layout");
}
