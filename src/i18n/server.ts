import "server-only";
import { cookies, headers } from "next/headers";
import { getDictionary, isLang } from "./index";
import { LANG_COOKIE, type Lang } from "./types";

export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLang(c)) return c;
  const al = (await headers()).get("accept-language") ?? "";
  return al.toLowerCase().startsWith("en") ? "en" : "fr";
}

export async function getDict() {
  const lang = await getLang();
  return { lang, d: getDictionary(lang) };
}
