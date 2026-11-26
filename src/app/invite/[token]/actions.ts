"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/i18n/server";
import { errorMessage } from "@/lib/errors";
import { BIZ_COOKIE, INVITE_COOKIE } from "@/lib/session";
import type { ActionState } from "@/components/forms";

export async function acceptInviteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { d } = await getDict();
  const token = String(fd.get("token") ?? "");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invitation", { p_token: token });
  if (error) return { error: errorMessage(error, d) };
  const jar = await cookies();
  jar.delete(INVITE_COOKIE);
  jar.set(BIZ_COOKIE, data as string, { path: "/", maxAge: 31536000, sameSite: "lax", httpOnly: true });
  redirect("/app");
}

/** Garde le jeton (cookie httpOnly, 1 jour) pour revenir sur l'invitation après connexion ou inscription. */
export async function rememberInviteAction(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return;
  (await cookies()).set(INVITE_COOKIE, token, { path: "/", maxAge: 86400, sameSite: "lax", httpOnly: true });
}

export async function forgetInviteAction() {
  (await cookies()).delete(INVITE_COOKIE);
}
