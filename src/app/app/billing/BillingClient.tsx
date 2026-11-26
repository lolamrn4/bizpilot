"use client";
import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { formatMoney } from "@/lib/money";
import { PAID_PLANS, type PaidPlan } from "@/lib/pricing";

type Billing = { plan: string; effective_plan: string; status: string; current_period_end: string | null; provider: string | null; has_paddle: boolean; scheduled_change: string | null; scheduled_change_at: string | null };
type PaddleJs = {
  Environment: { set: (e: string) => void };
  Initialize: (o: { token: string; eventCallback?: (e: { name?: string }) => void }) => void;
  Checkout: { open: (o: Record<string, unknown>) => void };
};
declare global { interface Window { Paddle?: PaddleJs } }

export function BillingClient({ grid, billing, businessCurrency, configured, clientToken, env }: {
  grid: Record<PaidPlan, Record<string, number | null>>; billing: Billing; businessCurrency: string; configured: boolean; clientToken: string; env: string;
}) {
  const { d, lang } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState<{ kind: "ok" | "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const date = (iso: string | null) => (iso ? new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", { dateStyle: "long" }).format(new Date(iso)) : "");
  const activeSub = billing.has_paddle && ["active", "trialing", "past_due"].includes(billing.status);

  const initPaddle = useCallback(() => {
    if (!window.Paddle || !clientToken) return;
    if (env !== "production") window.Paddle.Environment.set("sandbox");
    window.Paddle.Initialize({
      token: clientToken,
      eventCallback: (e) => { if (e.name === "checkout.completed") router.push("/app/billing?checkout=success"); },
    });
    setReady(true);
  }, [clientToken, env, router]);

  // Après paiement : on ATTEND la confirmation du webhook (la page de succès n'active jamais rien).
  useEffect(() => {
    if (sp.get("checkout") !== "success") return;
    setMsg({ kind: "info", text: d.billing.waiting });
    let n = 0;
    const t: ReturnType<typeof setInterval> = setInterval(async () => {
      n++;
      const r = await fetch("/api/billing/status", { cache: "no-store" }).then((x) => x.json()).catch(() => null);
      if (r && r.has_paddle && r.effective_plan && r.effective_plan !== "free") {
        clearInterval(t);
        setMsg({ kind: "ok", text: fmt(d.billing.activated, { plan: d.plans[r.effective_plan as PaidPlan] }) });
        router.replace("/app/billing");
        router.refresh();
      } else if (n >= 30) {
        clearInterval(t);
        setMsg({ kind: "info", text: d.billing.waitingLong });
      }
    }, 3000);
    return () => clearInterval(t);
  }, [sp, d, router]);

  async function choose(plan: PaidPlan) {
    setMsg(null);
    if (activeSub) {
      if (!window.confirm(fmt(d.billing.confirmChange, { plan: d.plans[plan] }))) return;
      setBusy(plan);
      const r = await fetch("/api/billing/change", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan }) });
      const j = await r.json().catch(() => ({}));
      setBusy(null);
      setMsg(r.ok ? { kind: "ok", text: j.ok } : { kind: "error", text: j.error ?? d.common.unexpected });
      return;
    }
    if (!ready || !window.Paddle) { setMsg({ kind: "error", text: d.billing.paddleLoadError }); return; }
    setBusy(plan);
    setMsg({ kind: "info", text: d.billing.opening });
    const r = await fetch("/api/billing/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan }) });
    const j = await r.json().catch(() => ({}));
    setBusy(null);
    if (!r.ok) { setMsg({ kind: "error", text: j.error ?? d.common.unexpected }); return; }
    setMsg(null);
    window.Paddle.Checkout.open({
      transactionId: j.transactionId,
      ...(j.email ? { customer: { email: j.email } } : {}),
      settings: { displayMode: "overlay", locale: lang, successUrl: `${window.location.origin}/app/billing?checkout=success` },
    });
  }

  async function manage() {
    setBusy("portal");
    const r = await fetch("/api/billing/portal", { method: "POST" });
    const j = await r.json().catch(() => ({}));
    setBusy(null);
    if (r.ok && j.url) window.location.href = j.url;
    else setMsg({ kind: "error", text: j.error ?? d.common.unexpected });
  }

  const eff = billing.effective_plan;
  const refCurrency = ["GNF", "XOF"].includes(businessCurrency) ? businessCurrency : "GNF";
  return (
    <div className="space-y-5">
      {configured && clientToken && <Script src="https://cdn.paddle.com/paddle/v2/paddle.js" onLoad={initPaddle} onReady={initPaddle} />}
      {msg && <p role={msg.kind === "error" ? "alert" : "status"} className={msg.kind === "error" ? "alert-error" : msg.kind === "ok" ? "alert-ok" : "alert-info"} data-testid="billing-msg">{msg.text}</p>}
      {!configured && <p className="alert-warn" data-testid="billing-not-configured">{d.billing.notConfigured}</p>}
      {billing.status === "past_due" && <p className="alert-error">{d.billing.pastDue}</p>}
      {billing.scheduled_change === "cancel" && billing.scheduled_change_at && <p className="alert-warn">{fmt(d.billing.cancelScheduled, { date: date(billing.scheduled_change_at) })}</p>}
      {billing.has_paddle && billing.status === "active" && !billing.scheduled_change && billing.current_period_end && <p className="text-sm text-ink-600">{fmt(d.billing.renews, { date: date(billing.current_period_end) })}</p>}
      {!billing.has_paddle && billing.provider === "test_manuel" && billing.current_period_end && eff !== "free" && <p className="alert-info">{fmt(d.billing.testPlan, { date: date(billing.current_period_end) })}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`card flex flex-col p-5 ${eff === "free" ? "ring-2 ring-brand-500" : ""}`} data-testid="plan-free">
          <h2 className="text-lg font-bold">{d.plans.free}</h2>
          <p className="mt-1 text-2xl font-extrabold">0</p>
          <p className="mt-2 flex-1 text-sm text-ink-600">{d.plans.freeDesc}</p>
          {eff === "free" ? <span className="badge mt-4 self-start bg-brand-50 text-brand-700">{d.billing.currentBadge}</span> : <p className="mt-4 text-xs text-ink-500">{d.billing.freeNote}</p>}
        </div>
        {PAID_PLANS.map((p) => {
          const g = grid[p];
          const isCurrent = eff === p;
          return (
            <div key={p} className={`card flex flex-col p-5 ${isCurrent ? "ring-2 ring-brand-500" : p === "premium" ? "ring-1 ring-brand-200" : ""}`} data-testid={`plan-${p}`}>
              <h2 className="text-lg font-bold">{d.plans[p]}</h2>
              <p className="mt-1 text-2xl font-extrabold text-ink-900">{formatMoney(g.USD, "USD", lang)}<span className="text-sm font-medium text-ink-500"> {d.billing.perMonth}</span></p>
              <p className="text-xs text-ink-500">{fmt(d.billing.reference, { price: formatMoney(g[refCurrency], refCurrency, lang) })}</p>
              <p className="mt-3 flex-1 text-sm text-ink-600">{d.plans[`${p}Desc`]}</p>
              <p className="mt-3 text-[11px] text-ink-500">{fmt(d.billing.charged, { usd: formatMoney(g.USD, "USD", lang), eur: formatMoney(g.EUR, "EUR", lang), gbp: formatMoney(g.GBP, "GBP", lang) })}</p>
              {isCurrent ? (
                <span className="badge mt-4 self-start bg-brand-50 text-brand-700">{d.billing.currentBadge}</span>
              ) : configured ? (
                <button type="button" className="btn-primary mt-4" disabled={busy !== null} onClick={() => choose(p)}>
                  {busy === p ? d.common.loading : activeSub ? d.billing.switchTo : d.billing.choose}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-ink-500">{d.billing.chargedNote}</p>
      {billing.has_paddle && configured && (
        <button type="button" className="btn-secondary" onClick={manage} disabled={busy !== null}>{busy === "portal" ? d.common.loading : d.billing.manage}</button>
      )}
      <p className="text-xs text-ink-500">
        {d.billing.legalNotice} <a className="underline" href="/legal/terms" target="_blank">{d.legal.terms}</a>, <a className="underline" href="/legal/refund" target="_blank">{d.legal.refund}</a> {d.legal.and} <a className="underline" href="/legal/privacy" target="_blank">{d.legal.privacy}</a>.
      </p>
    </div>
  );
}
