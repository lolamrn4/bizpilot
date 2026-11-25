import Link from "next/link";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { Logo } from "@/components/Logo";
import { BottomNav, Sidebar } from "@/components/AppNav";
import { LangSwitch } from "@/components/LangSwitch";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { business, entitlements } = await getAppContext();
  const { d } = await getDict();
  return (
    <div className="min-h-dvh lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-ink-100 bg-white px-4 py-5 lg:flex">
        <Link href="/app" className="mb-6 px-1"><Logo /></Link>
        <Sidebar />
        <div className="mt-auto rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
          <p className="truncate font-semibold text-ink-800">{business.name}</p>
          <p>{d.plans.current} : <span className="font-semibold text-brand-700">{d.plans[entitlements.plan]}</span> · {business.currency}</p>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-100 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <Link href="/app" className="lg:hidden"><Logo size={32} /></Link>
          <p className="hidden truncate text-sm font-semibold text-ink-700 lg:block">{business.name}</p>
          <div className="flex items-center gap-2">
            <span className="badge hidden bg-brand-50 text-brand-700 sm:inline-flex">{d.plans[entitlements.plan]}</span>
            <LangSwitch />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pt-5 pb-28 lg:px-8 lg:pb-12">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
