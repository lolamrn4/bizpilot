import Link from "next/link";
import { getDict } from "@/i18n/server";
import { fmt } from "@/i18n";
import { ResendForm } from "../AuthForms";

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { d } = await getDict();
  const { email = "" } = await searchParams;
  return (
    <div className="card space-y-5 p-6 text-center sm:p-8">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
      </div>
      <h1 className="h1">{d.auth.checkEmailTitle}</h1>
      <p className="text-sm text-ink-600">{fmt(d.auth.checkEmailText, { email })}</p>
      {email && <ResendForm email={email} />}
      <Link className="block text-sm font-semibold text-brand-700 hover:underline" href="/login">{d.auth.login}</Link>
    </div>
  );
}
