import Link from "next/link";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { Logo } from "@/components/Logo";
import { BottomNav, Sidebar } from "@/components/AppNav";
import { LangSwitch } from "@/components/LangSwitch";
import { BusinessSwitcher } from "@/components/BusinessSwitcher";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { business, businesses, entitlements, role, isOwner } = await getAppContext();
  const bizList = businesses.map((b) => ({ id: b.id, name: b.name }));
  const canAdd = isOwner && entitlements.features.includes("multi_business");
  const { d } = await getDict();
  return (
    <div className="min-h-dvh lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-ink-100 bg-white px-4 py-5 lg:flex">
        <Link href="/app" className="mb-6 px-1"><Logo /></Link>
        <Sidebar role={role} />
        <div className="mt-auto rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
          <p className="truncate font-semibold text-ink-800">{business.name}</p>
          <p>{d.roles[role]} · <span className="font-semibold text-brand-700">{d.plans[entitlements.plan]}</span> · {business.currency}</p>
          <div className="mt-2"><BusinessSwitcher businesses={bizList} currentId={business.id} canAdd={canAdd} compact /></div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-100 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <Link href="/app" className="lg:hidden"><Logo size={32} /></Link>
          <p className="hidden truncate text-sm font-semibold text-ink-700 lg:block">{business.name}</p>
          <div className="flex items-center gap-2">
            {isOwner ? <Link href="/app/billing" className="badge hidden bg-brand-50 text-brand-700 sm:inline-flex">{d.plans[entitlements.plan]}</Link> : <span className="badge hidden bg-ink-100 text-ink-700 sm:inline-flex">{d.roles[role]}</span>}
            <LangSwitch />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pt-5 pb-28 lg:px-8 lg:pb-12">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
