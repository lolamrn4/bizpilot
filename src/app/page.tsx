import Link from "next/link";
import { getDict } from "@/i18n/server";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { LegalFooter } from "@/components/LegalFooter";
import { getDisplayPrices } from "@/lib/prices";

const icons = [
  "M3 3h18v4H3zM5 7v13h14V7M9 12h6",
  "M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
  "M3 3v18h18M7 15l4-4 3 3 5-6",
  "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5",
  "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2",
];

export default async function Landing() {
  const { d, lang } = await getDict();
  const supabase = await createClient();
  const { data: plans } = await supabase.from("plans").select("code, price_gnf").eq("is_active", true).order("sort_order");
  const feats = [1, 2, 3, 4, 5, 6] as const;
  const PRICE_GRID = await getDisplayPrices(supabase);
  return (
    <main className="min-h-dvh bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <LangSwitch />
          <Link href="/login" className="btn-ghost hidden sm:inline-flex">{d.landing.login}</Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_80%_0%,var(--color-brand-100),transparent)]" />
        <div className="mx-auto max-w-6xl px-5 pt-10 pb-16 sm:pt-20">
          <p className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200">{d.brand.slogan2}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">{d.landing.heroTitle}</h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-600">{d.landing.heroText}</p>
          <p className="mt-3 max-w-2xl text-sm font-medium text-brand-700">{d.brand.slogan}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary px-6 py-3 text-base">{d.landing.start}</Link>
            <Link href="/login" className="btn-secondary px-6 py-3 text-base">{d.landing.login}</Link>
          </div>
        </div>
      </section>

      <section className="bg-ink-50 py-16">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 sm:grid-cols-2 lg:grid-cols-3">
          {feats.map((i) => (
            <div key={i} className="card p-6">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[i - 1]} /></svg>
              </div>
              <h3 className="h2">{d.landing[`f${i}t`]}</h3>
              <p className="mt-1.5 text-sm text-ink-600">{d.landing[`f${i}d`]}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="scroll-mt-4 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-2xl font-bold tracking-tight">{d.landing.plansTitle}</h2>
          <p className="mt-1 text-sm text-ink-500">{d.landing.plansNote}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(plans ?? []).map((p) => {
              const code = p.code as "free" | "standard" | "premium" | "business";
              return (
                <div key={code} className={`card flex flex-col p-6 ${code === "premium" ? "ring-2 ring-brand-500" : ""}`}>
                  <h3 className="text-lg font-bold">{d.plans[code]}</h3>
                  <p className="mt-2 text-2xl font-extrabold text-ink-900">
                    {code === "free" ? "0" : formatMoney(PRICE_GRID[code].USD, "USD", lang)}
                    <span className="text-sm font-medium text-ink-500"> {d.landing.perMonth}</span>
                  </p>
                  {code !== "free" && <p className="text-xs text-ink-500">{formatMoney(PRICE_GRID[code].EUR, "EUR", lang)} · {formatMoney(PRICE_GRID[code].GBP, "GBP", lang)} · {formatMoney(PRICE_GRID[code].GNF ?? p.price_gnf, "GNF", lang)}</p>}
                  <p className="mt-3 flex-1 text-sm text-ink-600">{d.plans[`${code}Desc`]}</p>
                  {code === "free" ? (
                    <Link href="/signup" className="btn-primary mt-5">{d.landing.start}</Link>
                  ) : (
                    <Link href="/signup" className="btn-secondary mt-5">{d.landing.start}</Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <LegalFooter />
    </main>
  );
}
