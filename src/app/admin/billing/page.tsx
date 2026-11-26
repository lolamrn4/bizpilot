import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/i18n/server";
import { billingStatus, paddleEnv } from "@/lib/paddle";
import { siteUrl } from "@/lib/site";
import { SetupPricesForm } from "../AdminForms";

export default async function AdminBilling() {
  const supabase = await createClient();
  const { d } = await getDict();
  const st = billingStatus();
  const env = paddleEnv();
  const [{ data: prices }, { data: events }] = await Promise.all([
    supabase.from("plan_provider_prices").select("plan_code, price_id").eq("environment", env),
    supabase.rpc("admin_logs", { p_kind: "billing", p_limit: 50 }),
  ]);
  const ev = (events ?? []) as { event_id: string; event_type: string; result: string | null; received_at: string }[];
  const check = (ok: boolean) => <span className={`badge ${ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{ok ? "✓" : "✗"}</span>;
  return (
    <>
      <p className="alert-info">{d.admin.envLabel} : <b>{env}</b></p>
      <section className="card p-5">
        <h2 className="h2 mb-3">{d.admin.config}</h2>
        <ul className="space-y-2 text-sm" data-testid="billing-config">
          <li>{check(st.apiKey)} PADDLE_API_KEY</li>
          <li>{check(st.webhookSecret)} PADDLE_WEBHOOK_SECRET</li>
          <li>{check(st.clientToken)} NEXT_PUBLIC_PADDLE_CLIENT_TOKEN</li>
          <li>{check(st.serviceRole)} SUPABASE_SERVICE_ROLE_KEY</li>
        </ul>
        <p className="mt-3 text-sm text-ink-600">{d.admin.webhookUrl} : <code className="rounded bg-ink-100 px-1.5 py-0.5">{await siteUrl()}/api/billing/webhook</code></p>
        <p className="hint">{d.admin.webhookEvents}</p>
      </section>
      <section className="card p-5">
        <h2 className="h2 mb-3">{d.admin.prices}</h2>
        {(prices ?? []).length > 0 ? (
          <ul className="mb-3 space-y-1 text-sm">{prices!.map((p) => <li key={p.plan_code}><b>{d.plans[p.plan_code as "standard"]}</b> : <code>{p.price_id}</code></li>)}</ul>
        ) : <p className="mb-3 text-sm text-ink-500">{d.admin.noPrices}</p>}
        {(prices ?? []).length < 3 && <SetupPricesForm disabled={!st.apiKey} />}
      </section>
      <section className="card p-5">
        <h2 className="h2 mb-3">{d.admin.events}</h2>
        {ev.length === 0 ? <p className="text-sm text-ink-500">{d.common.noData}</p> : (
          <div className="table-wrap"><table className="table"><thead><tr><th>{d.common.date}</th><th>Type</th><th>{d.admin.result}</th></tr></thead>
            <tbody>{ev.map((e) => <tr key={e.event_id}><td>{e.received_at.slice(0, 16).replace("T", " ")}</td><td>{e.event_type}</td><td className={e.result?.startsWith("error") ? "text-red-700" : ""}>{e.result}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </>
  );
}
