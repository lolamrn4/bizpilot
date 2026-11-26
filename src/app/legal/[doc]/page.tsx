import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDict } from "@/i18n/server";
import { fmt } from "@/i18n";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import { LegalFooter } from "@/components/LegalFooter";
import { formatDate } from "@/lib/money";
import { LEGAL, LEGAL_DOCS, legalContent, type LegalDoc } from "@/lib/legal-content";

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  const { d } = await getDict();
  return { title: LEGAL_DOCS.includes(doc as LegalDoc) ? d.legal[doc as LegalDoc] : undefined };
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  if (!LEGAL_DOCS.includes(doc as LegalDoc)) notFound();
  const { d, lang } = await getDict();
  const sections = legalContent[lang][doc as LegalDoc];
  return (
    <main className="min-h-dvh bg-white">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5"><Link href="/"><Logo /></Link><LangSwitch /></header>
      <article className="mx-auto max-w-3xl px-5 pb-12">
        <h1 className="h1">{d.legal[doc as LegalDoc]}</h1>
        <p className="mt-1 text-sm text-ink-500">{fmt(d.legal.updated, { date: formatDate(LEGAL.updated, lang) })}</p>
        {!LEGAL.reviewed && <p className="alert-warn mt-4">{d.legal.draftWarning}</p>}
        <div className="mt-6 space-y-6">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="h2 mb-2">{s.h}</h2>
              {s.p.map((t, i) => <p key={i} className="mb-2 text-[15px] leading-relaxed text-ink-700">{t}</p>)}
            </section>
          ))}
        </div>
      </article>
      <LegalFooter />
    </main>
  );
}
