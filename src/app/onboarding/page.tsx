import { redirect } from "next/navigation";
import { getDict } from "@/i18n/server";
import { getUserAndProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const up = await getUserAndProfile();
  if (!up) redirect("/login");
  const supabase = await createClient();
  const { count } = await supabase.from("businesses").select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) redirect("/app");
  const { d } = await getDict();
  return (
    <main className="min-h-dvh bg-gradient-to-b from-brand-50 via-ink-50 to-ink-50">
      <header className="mx-auto flex max-w-lg items-center justify-between px-5 pt-6"><Logo /><LangSwitch /></header>
      <div className="mx-auto max-w-lg px-5 py-8">
        <div className="card p-6 sm:p-8">
          <h1 className="h1">{d.onboarding.title}</h1>
          <p className="mt-1 mb-6 text-sm text-ink-500">{d.onboarding.subtitle}</p>
          <OnboardingForm ownerName={up.profile.full_name} />
        </div>
      </div>
    </main>
  );
}
