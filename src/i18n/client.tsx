"use client";
import { createContext, useContext } from "react";
import type { Dict, Lang } from "./types";

const Ctx = createContext<{ d: Dict; lang: Lang } | null>(null);

export function I18nProvider({ d, lang, children }: { d: Dict; lang: Lang; children: React.ReactNode }) {
  return <Ctx.Provider value={{ d, lang }}>{children}</Ctx.Provider>;
}
export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("I18nProvider missing");
  return v;
}
