"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLang, LANG_COOKIE } from "@/i18n";
import { createClient } from "@/lib/supabase/server";

export async function setLanguage(lang: string) {
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.from("profiles").update({ language: lang }).eq("id", user.id);
  revalidatePath("/", "layout");
}
