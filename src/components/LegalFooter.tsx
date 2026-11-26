import Link from "next/link";
import { getDict } from "@/i18n/server";

export async function LegalFooter() {
  const { d } = await getDict();
  return (
    <footer className="border-t border-ink-100 py-6 text-center text-xs text-ink-500">
      <nav className="mb-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        <Link className="hover:underline" href="/guides">{d.guides.footer}</Link>
        <Link className="hover:underline" href="/legal/terms">{d.legal.terms}</Link>
        <Link className="hover:underline" href="/legal/privacy">{d.legal.privacy}</Link>
        <Link className="hover:underline" href="/legal/refund">{d.legal.refund}</Link>
        <Link className="hover:underline" href="/legal/notice">{d.legal.notice}</Link>
      </nav>
      © {new Date().getFullYear()} Biz Pilot Digital · {d.brand.slogan2}
    </footer>
  );
}
