import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import { getDict } from "@/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { d } = await getDict();
  return (
    <main className="flex min-h-dvh flex-col bg-gradient-to-b from-brand-50 via-ink-50 to-ink-50">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 pt-6">
        <Link href="/"><Logo /></Link>
        <LangSwitch />
      </header>
      <div className="mx-auto w-full max-w-md flex-1 px-5 py-8">{children}</div>
      <p className="pb-6 text-center text-xs text-ink-400">{d.brand.slogan2}</p>
    </main>
  );
}
