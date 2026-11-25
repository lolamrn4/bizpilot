import { fr } from "./fr";
import { en } from "./en";
import type { Dict, Lang } from "./types";
export * from "./types";

export const dictionaries: Record<Lang, Dict> = { fr, en };
export const getDictionary = (lang: Lang): Dict => dictionaries[lang] ?? fr;
export const isLang = (v: unknown): v is Lang => v === "fr" || v === "en";

/** Remplace {cle} par la valeur correspondante. */
export function fmt(str: string, vars: Record<string, string | number>): string {
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
