"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { PERIODS, type Period } from "@/lib/periods";

export function PeriodFilter({ period, from, to, allPeriods }: { period: Period; from: string; to: string; allPeriods: boolean }) {
  const { d } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const go = (p: Period, extra: Record<string, string> = {}) => {
    const q = new URLSearchParams(sp.toString());
    q.set("period", p);
    q.delete("from"); q.delete("to"); q.delete("page");
    Object.entries(extra).forEach(([k, v]) => q.set(k, v));
    router.push(`${pathname}?${q.toString()}`);
  };
  // En Free, seules les périodes comprises dans le mois en cours sont proposées (le serveur vérifie aussi).
  const allowed = (p: Period) => allPeriods || p === "today" || p === "month" || p === "week";
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            disabled={!allowed(p)}
            title={!allowed(p) ? d.common.locked : undefined}
            onClick={() => (p === "custom" ? go("custom", { from: f, to: t }) : go(p))}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
              period === p ? "bg-ink-900 text-white" : "bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
            }`}
          >
            {d.periods[p]}
          </button>
        ))}
      </div>
      {period === "custom" && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm"><span className="label">{d.periods.from}</span><input type="date" className="input" value={f} onChange={(e) => setF(e.target.value)} /></label>
          <label className="text-sm"><span className="label">{d.periods.to}</span><input type="date" className="input" value={t} onChange={(e) => setT(e.target.value)} /></label>
          <button type="button" className="btn-secondary" onClick={() => go("custom", { from: f, to: t })}>{d.periods.apply}</button>
        </div>
      )}
      {!allPeriods && <p className="text-xs text-ink-500">{d.periods.freeOnly}</p>}
    </div>
  );
}
