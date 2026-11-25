import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@/i18n/server";
import { LoginForm } from "../AuthForms";

export async function generateMetadata(): Promise<Metadata> { return { title: (await getDict()).d.auth.loginTitle }; }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { d } = await getDict();
  const { error } = await searchParams;
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="h1">{d.auth.loginTitle}</h1>
      <p className="mt-1 mb-6 text-sm text-ink-500">{d.auth.loginSubtitle}</p>
      {error === "link" && <p className="alert-error mb-4">{d.auth.errLink}</p>}
      <LoginForm />
      <p className="mt-6 text-center text-sm text-ink-600">
        {d.auth.noAccount} <Link className="font-semibold text-brand-700 hover:underline" href="/signup">{d.auth.signupTitle}</Link>
      </p>
    </div>
  );
}
