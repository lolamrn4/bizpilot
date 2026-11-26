import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/i18n/server";

export default async function AdminLogs() {
  const supabase = await createClient();
  const { d } = await getDict();
  const [{ data: errors }, { data: audit }] = await Promise.all([
    supabase.rpc("admin_logs", { p_kind: "errors", p_limit: 100 }),
    supabase.rpc("admin_logs", { p_kind: "audit", p_limit: 100 }),
  ]);
  const errs = (errors ?? []) as { id: number; context: string; message: string; created_at: string; email: string | null }[];
  const aud = (audit ?? []) as { id: number; action: string; target: string | null; details: unknown; created_at: string; admin_email: string | null }[];
  const ts = (s: string) => s.slice(0, 16).replace("T", " ");
  return (
    <>
      <section className="card p-5">
        <h2 className="h2 mb-3">{d.admin.audit}</h2>
        {aud.length === 0 ? <p className="text-sm text-ink-500">{d.common.noData}</p> : (
          <ul className="space-y-1.5 text-sm" data-testid="audit-log">{aud.map((a) => (
            <li key={a.id}><span className="text-ink-400">{ts(a.created_at)}</span> · <b>{a.action}</b> · {a.target} · <span className="text-ink-500">{a.admin_email}</span>
              <code className="mt-0.5 block truncate text-[11px] text-ink-400">{JSON.stringify(a.details)}</code></li>
          ))}</ul>
        )}
      </section>
      <section className="card p-5">
        <h2 className="h2 mb-3">{d.admin.errors}</h2>
        {errs.length === 0 ? <p className="text-sm text-ink-500">{d.common.noData}</p> : (
          <ul className="space-y-1.5 text-sm">{errs.map((e) => <li key={e.id}><span className="text-ink-400">{ts(e.created_at)}</span> · <b>{e.context}</b> · {e.message} {e.email && <span className="text-ink-400">({e.email})</span>}</li>)}</ul>
        )}
      </section>
    </>
  );
}
