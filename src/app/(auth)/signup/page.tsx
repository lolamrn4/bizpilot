import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@/i18n/server";
import { SignupForm } from "../AuthForms";

export async function generateMetadata(): Promise<Metadata> { return { title: (await getDict()).d.auth.signupTitle }; }

export default async function SignupPage() {
  const { d } = await getDict();
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="h1">{d.auth.signupTitle}</h1>
      <p className="mt-1 mb-6 text-sm text-ink-500">{d.auth.signupSubtitle}</p>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-ink-600">
        {d.auth.haveAccount} <Link className="font-semibold text-brand-700 hover:underline" href="/login">{d.auth.login}</Link>
      </p>
    </div>
  );
}
