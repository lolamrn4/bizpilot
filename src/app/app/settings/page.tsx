import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { logoutAction } from "@/app/(auth)/actions";
import { BusinessForm, PasswordForm, ProfileForm } from "./SettingsForms";

export default async function SettingsPage() {
  const { user, profile, business, supabase, entitlements } = await getAppContext();
  const { d } = await getDict();
  const [{ count: s }, { count: e }, { count: p }] = await Promise.all([
    supabase.from("sales").select("id", { count: "exact", head: true }).eq("business_id", business.id),
    supabase.from("expenses").select("id", { count: "exact", head: true }).eq("business_id", business.id),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("business_id", business.id),
  ]);
  const currencyLocked = (s ?? 0) + (e ?? 0) + (p ?? 0) > 0;
  const lim = entitlements.limits;
  const usage = [
    { label: d.plans.salesUsage, used: entitlements.usage.sales_month, max: lim.max_sales_month },
    { label: d.plans.expensesUsage, used: entitlements.usage.expenses_month, max: lim.max_expenses_month },
    { label: d.plans.productsUsage, used: entitlements.usage.products, max: lim.max_products },
  ];
  return (
    <div className="space-y-5">
      <h1 className="h1">{d.settings.title}</h1>
      <section className="card p-5">
        <h2 className="h2 mb-1">{d.settings.plan}</h2>
        <p className="text-sm text-ink-600">{d.plans.current} : <span className="font-semibold text-brand-700">{d.plans[entitlements.plan]}</span></p>
        <p className="mt-1 text-sm text-ink-500">{d.plans[`${entitlements.plan}Desc`]}</p>
        <h3 className="mt-4 mb-2 text-sm font-semibold text-ink-700">{d.plans.usage}</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {usage.map((u) => (
            <div key={u.label} className="rounded-xl bg-ink-50 p-3 text-sm">
              <p className="text-ink-500">{u.label}</p>
              <p className="font-semibold">{u.used} / {u.max ?? d.plans.unlimited}</p>
              {u.max ? <div className="mt-1.5 h-1.5 rounded-full bg-ink-200"><div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${Math.min(100, (u.used / u.max) * 100)}%` }} /></div> : null}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-500">{d.plans.paymentsSoon}</p>
      </section>
      <section className="card p-5"><h2 className="h2 mb-4">{d.settings.profile}</h2><ProfileForm fullName={profile.full_name} email={user.email ?? ""} /></section>
      <section className="card p-5"><h2 className="h2 mb-4">{d.settings.business}</h2><BusinessForm business={business} currencyLocked={currencyLocked} /></section>
      <section className="card p-5"><h2 className="h2 mb-4">{d.settings.security}</h2><PasswordForm /></section>
      <section className="card p-5">
        <h2 className="h2 mb-3">{d.settings.dangerZone}</h2>
        <form action={logoutAction}><button className="btn-secondary">{d.auth.logout}</button></form>
      </section>
    </div>
  );
}
