import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDict } from "@/i18n/server";
import { getDictionary } from "@/i18n";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import { LegalFooter } from "@/components/LegalFooter";
import { GUIDES, getGuide } from "@/lib/guides";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  const pair = getGuide(g.pair);
  return {
    title: g.title,
    description: g.description,
    alternates: {
      canonical: `/guides/${g.slug}`,
      languages: { [g.lang]: `/guides/${g.slug}`, ...(pair ? { [pair.lang]: `/guides/${pair.slug}` } : {}) },
    },
    openGraph: { title: g.title, description: g.description, type: "article", url: `/guides/${g.slug}`, locale: g.lang === "fr" ? "fr_FR" : "en_US" },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();
  await getDict();
  // Les textes autour de l'article suivent la langue de l'article.
  const t = getDictionary(g.lang).guides;
  const pair = getGuide(g.pair);
  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: g.title, description: g.description, inLanguage: g.lang, publisher: { "@type": "Organization", name: "Biz Pilot Digital" } };
  return (
    <main className="min-h-dvh bg-white" lang={g.lang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5"><Link href="/"><Logo /></Link><LangSwitch /></header>
      <article className="mx-auto max-w-3xl px-5 pb-12">
        <p className="text-sm"><Link href="/guides" className="text-brand-700 hover:underline">← {t.all}</Link>
          {pair && <> · <Link href={`/guides/${pair.slug}`} hrefLang={pair.lang} className="text-brand-700 hover:underline">{t.otherLang}</Link></>}</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900">{g.title}</h1>
        <div className="mt-5 space-y-3">
          {g.intro.map((p, i) => <p key={i} className="text-[17px] leading-relaxed text-ink-700">{p}</p>)}
        </div>
        <div className="mt-8 space-y-8">
          {g.sections.map((s) => (
            <section key={s.h}>
              <h2 className="h2 mb-3">{s.h}</h2>
              {s.p?.map((p, i) => <p key={i} className="mb-3 text-[16px] leading-relaxed text-ink-700">{p}</p>)}
              {s.list && (
                <ul className="list-disc space-y-2 pl-6 text-[16px] leading-relaxed text-ink-700">
                  {s.list.map((li, i) => <li key={i}>{li}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>
        <div className="mt-10 rounded-2xl bg-brand-50 p-6 ring-1 ring-brand-200">
          <h2 className="text-xl font-bold text-ink-900">{t.ctaTitle}</h2>
          <p className="mt-1 text-ink-600">{t.ctaText}</p>
          <Link href="/signup" className="btn-primary mt-4 inline-flex">{t.ctaButton}</Link>
        </div>
        <p className="mt-6 text-xs text-ink-500">{t.disclaimer}</p>
      </article>
      <LegalFooter />
    </main>
  );
}
