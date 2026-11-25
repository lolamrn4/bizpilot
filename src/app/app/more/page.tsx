import Link from "next/link";
import { getDict } from "@/i18n/server";
import { Icon, ICONS } from "@/components/AppNav";
import { logoutAction } from "@/app/(auth)/actions";

export default async function MorePage() {
  const { d } = await getDict();
  const items = [
    { href: "/app/products", label: d.nav.products, icon: ICONS.products },
    { href: "/app/reports", label: d.nav.reports, icon: ICONS.reports },
    { href: "/app/settings", label: d.nav.settings, icon: ICONS.settings },
  ];
  return (
    <div className="space-y-4">
      <h1 className="h1">{d.nav.more}</h1>
      <div className="card divide-y divide-ink-100">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="flex items-center gap-3 px-4 py-4 font-medium text-ink-800 hover:bg-ink-50">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon d={i.icon} /></span>
            {i.label}
          </Link>
        ))}
      </div>
      <form action={logoutAction}><button className="btn-secondary w-full">{d.auth.logout}</button></form>
    </div>
  );
}
