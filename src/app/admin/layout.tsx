import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/i18n/server";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import { AdminNav } from "./AdminNav";

export const dynamic = "force-dynamic";

/** Espace admin : propriétaire uniquement. Vérifié ici ET dans chaque fonction de la base. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) notFound();
  const { d } = await getDict();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-ink-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3"><Link href="/admin"><Logo size={32} /></Link><span className="badge bg-ink-900 text-white">{d.admin.title}</span></div>
          <div className="flex items-center gap-2"><Link href="/app" className="btn-ghost hidden px-3 py-1.5 text-sm sm:inline-flex">← {d.admin.nav.backToApp}</Link><LangSwitch /></div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-3"><AdminNav /></div>
      </header>
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">{children}</main>
    </div>
  );
}
