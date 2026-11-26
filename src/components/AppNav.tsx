"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";

const P = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  sales: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  expenses: "M2 7h20v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM16 14h2M2 7l3-4h14l3 4",
  products: "M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
  reports: "M3 3v18h18M7 15l4-4 3 3 5-6",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  more: "M4 6h16M4 12h16M4 18h16",
  plus: "M12 5v14M5 12h14",
  billing: "M2 5h20v14H2zM2 10h20M6 15h4",
  pricing: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01",
  forecast: "M3 17l6-6 4 4 8-8M15 7h6v6",
  coach: "M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2z",
  team: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  compare: "M18 20V10M12 20V4M6 20v-6",
  customers: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};

/** Liens visibles selon le rôle dans l'entreprise courante (la base applique aussi ces règles). */
export type NavAccess = { role: "owner" | "manager" | "staff" };

export function Icon({ d, className = "size-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
export const ICONS = P;

const isActive = (path: string, href: string) => (href === "/app" ? path === "/app" : path === href || path.startsWith(href + "/"));

export function Sidebar({ role }: NavAccess) {
  const { d } = useI18n();
  const path = usePathname();
  const mgr = role !== "staff";
  const main = [
    { href: "/app", label: d.nav.dashboard, icon: P.home },
    { href: "/app/sales", label: d.nav.sales, icon: P.sales },
    { href: "/app/customers", label: d.nav.customers, icon: P.customers },
    { href: "/app/expenses", label: d.nav.expenses, icon: P.expenses },
    { href: "/app/products", label: d.nav.products, icon: P.products },
    ...(mgr ? [{ href: "/app/reports", label: d.nav.reports, icon: P.reports }, { href: "/app/compare", label: d.nav.compare, icon: P.compare }] : []),
  ];
  const bottom = [
    ...(mgr ? [{ href: "/app/team", label: d.nav.team, icon: P.team }] : []),
    ...(role === "owner" ? [{ href: "/app/billing", label: d.nav.billing, icon: P.billing }] : []),
    { href: "/app/settings", label: d.nav.settings, icon: P.settings },
  ];
  const intel = mgr ? [
    { href: "/app/pricing", label: d.nav.pricing, icon: P.pricing },
    { href: "/app/forecast", label: d.nav.forecast, icon: P.forecast },
    { href: "/app/coach", label: d.nav.coach, icon: P.coach },
  ] : [];
  const link = (i: { href: string; label: string; icon: string }) => (
    <Link
      key={i.href}
      href={i.href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        isActive(path, i.href) ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
      }`}
    >
      <Icon d={i.icon} />
      {i.label}
    </Link>
  );
  return (
    <nav className="space-y-1">
      <Link href="/app/sales/new" className="btn-primary mb-4 w-full"><Icon d={P.plus} /> {d.nav.newSale}</Link>
      {main.map(link)}
      {intel.length > 0 && <p className="px-3 pt-4 pb-1 text-[11px] font-semibold tracking-wider text-ink-400 uppercase">{d.intel.section}</p>}
      {intel.map(link)}
      <div className="pt-4">{bottom.map(link)}</div>
    </nav>
  );
}

export function BottomNav() {
  const { d } = useI18n();
  const path = usePathname();
  const items = [
    { href: "/app", label: d.nav.home, icon: P.home },
    { href: "/app/sales", label: d.nav.sales, icon: P.sales },
    null,
    { href: "/app/expenses", label: d.nav.expenses, icon: P.expenses },
    { href: "/app/more", label: d.nav.more, icon: P.more },
  ];
  const moreActive = ["/app/more", "/app/products", "/app/reports", "/app/settings", "/app/pricing", "/app/forecast", "/app/coach", "/app/billing", "/app/team", "/app/compare", "/app/customers"].some((h) => isActive(path, h));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2">
        {items.map((i, idx) =>
          i === null ? (
            <Link key="new" href="/app/sales/new" aria-label={d.nav.newSale} className="mx-auto -mt-5 mb-2 flex size-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30 active:bg-brand-700">
              <Icon d={P.plus} className="size-7" />
            </Link>
          ) : (
            <Link
              key={i.href}
              href={i.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                (i.href === "/app/more" ? moreActive : isActive(path, i.href)) ? "text-brand-700" : "text-ink-500"
              }`}
              data-idx={idx}
            >
              <Icon d={i.icon} />
              {i.label}
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}
