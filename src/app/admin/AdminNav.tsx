"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";

export function AdminNav() {
  const { d } = useI18n();
  const path = usePathname();
  const items = [
    ["/admin", d.admin.nav.dashboard], ["/admin/users", d.admin.nav.users], ["/admin/businesses", d.admin.nav.businesses],
    ["/admin/plans", d.admin.nav.plans], ["/admin/billing", d.admin.nav.billing], ["/admin/logs", d.admin.nav.logs],
  ] as const;
  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1">
      {items.map(([href, label]) => {
        const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return <Link key={href} href={href} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${active ? "bg-ink-900 text-white" : "bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"}`}>{label}</Link>;
      })}
    </nav>
  );
}
