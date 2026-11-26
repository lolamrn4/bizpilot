"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/i18n/server";
import { isLang, LANG_COOKIE } from "@/i18n";
import { siteUrl } from "@/lib/site";
import type { ActionState } from "@/components/forms";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function authError(e: { code?: string; status?: number; message?: string }, d: Awaited<ReturnType<typeof getDict>>["d"]) {
  const c = e.code ?? "";
  if (c === "invalid_credentials") return d.auth.errInvalid;
  if (c === "email_not_confirmed") return d.auth.errNotConfirmed;
  if (c === "user_already_exists" || c === "email_exists") return d.auth.errExists;
  if (c === "weak_password") return d.auth.errWeak;
  if (c === "email_address_invalid") return d.auth.errEmail;
  if (e.status === 429 || c.startsWith("over_")) return d.auth.errRate;
  return d.common.unexpected;
}

async function setLangCookie(lang: string) {
  if (isLang(lang)) (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: 31536000, sameSite: "lax" });
}

export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { d } = await getDict();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!EMAIL.test(email) || !password) return { error: d.errors.required };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: authError(error, d) };
  const { data: p } = await supabase.from("profiles").select("language").eq("id", data.user.id).single();
  if (p?.language) await setLangCookie(p.language);
  const invite = (await cookies()).get("bp_invite")?.value;
  redirect(invite && /^[a-f0-9]{64}$/.test(invite) ? `/invite/${invite}` : "/app");
}

export async function signupAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { d } = await getDict();
  const full_name = String(fd.get("full_name") ?? "").trim().slice(0, 120);
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const language = String(fd.get("language") ?? "fr");
  if (!full_name || !email) return { error: d.errors.required };
  if (!EMAIL.test(email)) return { error: d.auth.errEmail };
  if (password.length < 8) return { error: d.auth.errWeak };
  if (fd.get("terms") !== "on") return { error: d.auth.errTerms };
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteUrl()}/auth/callback?next=/onboarding`,
      data: { full_name, language: isLang(language) ? language : "fr" },
    },
  });
  if (error) return { error: authError(error, d) };
  await setLangCookie(language);
  redirect(`/check-email?email=${encodeURIComponent(email)}`);
}

export async function resendAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { d } = await getDict();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) return { error: d.auth.errEmail };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${await siteUrl()}/auth/callback?next=/onboarding` },
  });
  if (error) return { error: authError(error, d) };
  return { ok: d.auth.resent };
}

export async function forgotAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { d } = await getDict();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) return { error: d.auth.errEmail };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/reset-password`,
  });
  if (error && (error.status === 429 || error.code?.startsWith("over_"))) return { error: d.auth.errRate };
  // Même message que le compte existe ou non (pas de fuite d'information).
  return { ok: d.auth.forgotSent };
}

export async function resetAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { d } = await getDict();
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: d.auth.errWeak };
  if (password !== String(fd.get("confirm") ?? "")) return { error: d.auth.errMismatch };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.code === "same_password" ? d.auth.errWeak : authError(error, d) };
  return { ok: d.auth.resetDone };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete("bp_biz");
  redirect("/login");
}
