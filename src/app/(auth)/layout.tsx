import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import { LegalFooter } from "@/components/LegalFooter";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col bg-gradient-to-b from-brand-50 via-ink-50 to-ink-50">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 pt-6">
        <Link href="/"><Logo /></Link>
        <LangSwitch />
      </header>
      <div className="mx-auto w-full max-w-md flex-1 px-5 py-8">{children}</div>
      <LegalFooter />
    </main>
  );
}
