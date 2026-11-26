"use client";
import { useState } from "react";
import { useI18n } from "@/i18n/client";

export function AiExplain({ kind, enabled }: { kind: "coach" | "forecast" | "pricing"; enabled: boolean }) {
  const { d } = useI18n();
  const [state, setState] = useState<{ busy?: boolean; text?: string; source?: string; rejected?: boolean; error?: string; unavailable?: boolean }>({});
  if (!enabled) return null;
  async function run() {
    setState({ busy: true });
    try {
      const r = await fetch("/api/ai/explain", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind }) });
      const j = await r.json();
      setState(r.ok ? j : { error: j.error ?? d.intel.aiUnavailable });
    } catch {
      setState({ error: d.intel.aiUnavailable });
    }
  }
  return (
    <div className="space-y-3">
      <button type="button" onClick={run} disabled={state.busy} className="btn-secondary">
        <svg viewBox="0 0 24 24" className="size-4 text-brand-600" fill="currentColor" aria-hidden="true"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8zM19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9z" /></svg>
        {state.busy ? d.intel.aiWorking : d.intel.explainAi}
      </button>
      {state.error && <p className="alert-error">{state.error}</p>}
      {state.text && (
        <div className="card border-brand-200 bg-brand-50/40 p-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-brand-700 uppercase">{state.source === "ai" ? d.intel.aiTitle : d.intel.aiRules}</p>
          {state.rejected && <p className="alert-warn mb-3">{d.intel.aiRejected}</p>}
          {state.unavailable && <p className="alert-warn mb-3">{d.intel.aiUnavailable}</p>}
          <p className="text-sm leading-relaxed whitespace-pre-line text-ink-800">{state.text}</p>
          <p className="mt-3 text-[11px] text-ink-500">{d.intel.aiDisclaimer}</p>
        </div>
      )}
    </div>
  );
}
