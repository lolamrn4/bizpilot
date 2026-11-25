import type { fr } from "./fr";
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Dict = Widen<typeof fr>;
export type Lang = "fr" | "en";
export const LANGS: Lang[] = ["fr", "en"];
export const LANG_COOKIE = "bp_lang";
