import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@/i18n/server";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import { LegalFooter } from "@/components/LegalFooter";
import { GUIDES } from "@/lib/guides";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getDict();
  return { title: d.guides.title, description: d.guides.subtitle, alternates: { canonical: "/guides" } };
}

export default async function GuidesIndex() {
  const { d, lang } = await getDict();
  const mine = GUIDES.filter((g) => g.lang === lang);
  const other = GUIDES.filter((g) => g.lang !== lang);
  return (
    <main className="min-h-dvh bg-white">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5"><Link href="/"><Logo /></Link><LangSwitch /></header>
      <section className="mx-auto max-w-3xl px-5 pb-12">
        <h1 className="h1">{d.guides.title}</h1>
        <p className="mt-2 text-ink-600">{d.guides.subtitle}</p>
        <div className="mt-8 space-y-4">
          {mine.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="card block p-5 hover:ring-2 hover:ring-brand-300">
              <h2 className="text-lg font-bold text-ink-900">{g.title}</h2>
              <p className="mt-1 text-sm text-ink-600">{g.description}</p>
              <p className="mt-3 text-sm font-semibold text-brand-700">{d.guides.read} →</p>
            </Link>
          ))}
        </div>
        <h2 className="mt-12 text-sm font-semibold uppercase tracking-wide text-ink-500">{d.guides.otherLang}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {other.map((g) => (
            <li key={g.slug}><Link href={`/guides/${g.slug}`} className="text-brand-700 hover:underline" hrefLang={g.lang}>{g.title}</Link></li>
          ))}
        </ul>
      </section>
      <LegalFooter />
    </main>
  );
}
