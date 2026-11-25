import Link from "next/link";
import { getDict } from "@/i18n/server";
import { ForgotForm } from "../AuthForms";

export default async function ForgotPage() {
  const { d } = await getDict();
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="h1">{d.auth.forgotTitle}</h1>
      <p className="mt-1 mb-6 text-sm text-ink-500">{d.auth.forgotText}</p>
      <ForgotForm />
      <p className="mt-6 text-center text-sm"><Link className="font-semibold text-brand-700 hover:underline" href="/login">{d.common.back}</Link></p>
    </div>
  );
}
