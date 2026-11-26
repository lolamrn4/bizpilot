import { redirect } from "next/navigation";
import { getDict } from "@/i18n/server";
import { cookies } from "next/headers";
import { getUserAndProfile, INVITE_COOKIE } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const up = await getUserAndProfile();
  if (!up) redirect("/login");
  // Après une inscription via un lien d'invitation : on revient sur l'invitation.
  const invite = (await cookies()).get(INVITE_COOKIE)?.value;
  if (invite && /^[a-f0-9]{64}$/.test(invite)) redirect(`/invite/${invite}`);
  const supabase = await createClient();
  const { count } = await supabase.from("businesses").select("id", { count: "exact", head: true });
  const adding = (await searchParams).new === "1";
  if ((count ?? 0) > 0 && !adding) redirect("/app");
  const { d } = await getDict();
  return (
    <main className="min-h-dvh bg-gradient-to-b from-brand-50 via-ink-50 to-ink-50">
      <header className="mx-auto flex max-w-lg items-center justify-between px-5 pt-6"><Logo /><LangSwitch /></header>
      <div className="mx-auto max-w-lg px-5 py-8">
        <div className="card p-6 sm:p-8">
          <h1 className="h1">{adding ? d.switcher.newTitle : d.onboarding.title}</h1>
          <p className="mt-1 mb-6 text-sm text-ink-500">{adding ? d.switcher.newSubtitle : d.onboarding.subtitle}</p>
          <OnboardingForm ownerName={up.profile.full_name} />
        </div>
      </div>
    </main>
  );
}
