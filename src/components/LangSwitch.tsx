"use client";
import { useTransition } from "react";
import { useI18n } from "@/i18n/client";
import { setLanguage } from "@/app/lang-actions";

export function LangSwitch({ className = "" }: { className?: string }) {
  const { lang } = useI18n();
  const [pending, start] = useTransition();
  return (
    <div className={`inline-flex rounded-xl border border-ink-200 bg-white p-0.5 text-xs font-semibold ${className}`} aria-busy={pending}>
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => start(() => setLanguage(l))}
          className={`rounded-lg px-2.5 py-1 uppercase ${lang === l ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-50"}`}
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
