import Link from "next/link";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { Icon, ICONS } from "@/components/AppNav";
import { BusinessSwitcher } from "@/components/BusinessSwitcher";
import { logoutAction } from "@/app/(auth)/actions";
import { InstallCard } from "@/components/InstallApp";

export default async function MorePage() {
  const { isManager, isOwner, businesses, business, entitlements } = await getAppContext();
  const { d } = await getDict();
  const items = [
    { href: "/app/customers", label: d.nav.customers, icon: ICONS.customers, show: true },
    { href: "/app/products", label: d.nav.products, icon: ICONS.products, show: true },
    { href: "/app/pricing", label: d.nav.pricing, icon: ICONS.pricing, show: isManager },
    { href: "/app/forecast", label: d.nav.forecast, icon: ICONS.forecast, show: isManager },
    { href: "/app/coach", label: d.nav.coach, icon: ICONS.coach, show: isManager },
    { href: "/app/reports", label: d.nav.reports, icon: ICONS.reports, show: isManager },
    { href: "/app/compare", label: d.nav.compare, icon: ICONS.compare, show: isManager },
    { href: "/app/team", label: d.nav.team, icon: ICONS.team, show: isManager },
    { href: "/app/billing", label: d.nav.billing, icon: ICONS.billing, show: isOwner },
    { href: "/app/settings", label: d.nav.settings, icon: ICONS.settings, show: true },
  ].filter((i) => i.show);
  return (
    <div className="space-y-4">
      <h1 className="h1">{d.nav.more}</h1>
      <div className="card p-4">
        <BusinessSwitcher businesses={businesses.map((b) => ({ id: b.id, name: b.name }))} currentId={business.id} canAdd={isOwner && entitlements.features.includes("multi_business")} />
      </div>
      <div className="card divide-y divide-ink-100">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="flex items-center gap-3 px-4 py-4 font-medium text-ink-800 hover:bg-ink-50">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon d={i.icon} /></span>
            {i.label}
          </Link>
        ))}
      </div>
      <InstallCard />
      <form action={logoutAction}><button className="btn-secondary w-full">{d.auth.logout}</button></form>
    </div>
  );
}

