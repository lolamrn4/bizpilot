import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/i18n/server";
import { fmt } from "@/i18n";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import type { Role } from "@/lib/types";
import { AcceptForm } from "./AcceptForm";
import { RememberInvite } from "./RememberInvite";

export const dynamic = "force-dynamic";

type Info = { status: "pending" | "invalid" | "revoked" | "accepted" | "expired"; business_name?: string; role?: Role; email?: string };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { d } = await getDict();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let info: Info | null = null;
  if (user) {
    const { data } = await supabase.rpc("invitation_info", { p_token: token });
    info = (data as Info) ?? { status: "invalid" };
  }
  return (
    <main className="min-h-dvh bg-gradient-to-b from-brand-50 via-ink-50 to-ink-50">
      <header className="mx-auto flex max-w-md items-center justify-between px-5 pt-6"><Link href="/"><Logo /></Link><LangSwitch /></header>
      <div className="mx-auto max-w-md px-5 py-8">
        <div className="card space-y-4 p-6 sm:p-8">
          <h1 className="h1">{d.invite.title}</h1>
          {!user ? (
            <>
              {/* Le jeton est gardé en cookie le temps de se connecter ou de créer un compte. */}
              <RememberInvite token={token} />
              <p className="text-sm text-ink-600">{d.invite.loginFirst}</p>
              <div className="flex flex-col gap-2">
                <Link href="/login" className="btn-primary w-full">{d.invite.login}</Link>
                <Link href="/signup" className="btn-secondary w-full">{d.invite.signup}</Link>
              </div>
            </>
          ) : info?.status === "pending" ? (
            <>
              <p className="text-ink-700">{fmt(d.invite.text, { business: info.business_name ?? "", role: d.roles[info.role ?? "manager"] })}</p>
              <p className="text-sm text-ink-500">{fmt(d.invite.forEmail, { email: info.email ?? "" })}</p>
              <AcceptForm token={token} />
            </>
          ) : (
            <>
              <RememberInvite token={token} forget />
              <p className="alert-error">{d.invite[info?.status === "revoked" || info?.status === "accepted" || info?.status === "expired" ? info.status : "invalid"]}</p>
              <Link href="/app" className="btn-secondary w-full">{d.invite.backHome}</Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
