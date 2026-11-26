"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAppContext, BIZ_COOKIE } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { errorMessage } from "@/lib/errors";
import { siteUrl } from "@/lib/site";
import type { ActionState } from "@/components/forms";

export type InviteState = (ActionState & { link?: string }) | undefined;

export async function createInviteAction(_: InviteState, fd: FormData): Promise<InviteState> {
  const { supabase, business } = await getAppContext();
  const { d } = await getDict();
  const email = String(fd.get("email") ?? "").trim();
  const role = String(fd.get("role") ?? "manager");
  if (!email) return { error: d.errors.required };
  const { data, error } = await supabase.rpc("create_invitation", { p_business: business.id, p_email: email, p_role: role });
  if (error) return { error: errorMessage(error, d) };
  revalidatePath("/app/team");
  return { ok: d.team.linkReady, link: `${await siteUrl()}/invite/${data as string}` };
}

export async function revokeInviteAction(fd: FormData) {
  const { supabase } = await getAppContext();
  await supabase.rpc("revoke_invitation", { p_id: String(fd.get("id")) });
  revalidatePath("/app/team");
}

export async function setRoleAction(fd: FormData) {
  const { supabase, business } = await getAppContext();
  await supabase.rpc("set_member_role", { p_business: business.id, p_user: String(fd.get("user")), p_role: String(fd.get("role")) });
  revalidatePath("/app/team");
}

export async function removeMemberAction(fd: FormData) {
  const { supabase, business } = await getAppContext();
  await supabase.rpc("remove_member", { p_business: business.id, p_user: String(fd.get("user")) });
  revalidatePath("/app/team");
}

export async function leaveBusinessAction() {
  const { supabase, business, user, isOwner } = await getAppContext();
  if (isOwner) redirect("/app");
  await supabase.rpc("remove_member", { p_business: business.id, p_user: user.id });
  (await cookies()).delete(BIZ_COOKIE);
  redirect("/app");
}

/** Changer d'entreprise : l'identifiant n'est accepté que si l'utilisateur y a accès (RLS). */
export async function switchBusinessAction(fd: FormData) {
  const { supabase } = await getAppContext();
  const id = String(fd.get("business") ?? "");
  const { data } = await supabase.from("businesses").select("id").eq("id", id).maybeSingle();
  if (data) (await cookies()).set(BIZ_COOKIE, data.id, { path: "/", maxAge: 31536000, sameSite: "lax", httpOnly: true });
  redirect("/app");
}
