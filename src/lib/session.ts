import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Business, Entitlements, Role } from "@/lib/types";

export const BIZ_COOKIE = "bp_biz";
export const INVITE_COOKIE = "bp_invite";

export const getUserAndProfile = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("full_name, language").eq("id", user.id).single();
  return { user, profile: profile ?? { full_name: "", language: "fr" } };
});

/** Contexte de l'espace connecté : utilisateur, entreprise courante, droits de la formule. */
export const getAppContext = cache(async () => {
  const up = await getUserAndProfile();
  if (!up) redirect("/login");
  const supabase = await createClient();
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, owner_id, name, owner_name, sector, city, currency, timezone, target_margin, min_margin, cash_opening_balance, cash_opening_date, phone, address, tax_id, receipt_footer, logo_path")
    .order("created_at");
  if (!businesses || businesses.length === 0) redirect("/onboarding");
  const wanted = (await cookies()).get(BIZ_COOKIE)?.value;
  const business = (businesses.find((b) => b.id === wanted) ?? businesses[0]) as Business;
  const { data: ent } = await supabase.rpc("my_entitlements", { p_business: business.id });
  const entitlements = (ent ?? { plan: "free", features: [], limits: {}, usage: { sales_month: 0, expenses_month: 0, products: 0 } }) as Entitlements;
  const role: Role = entitlements.role ?? (business.owner_id === up.user.id ? "owner" : "staff");
  return { ...up, supabase, businesses: businesses as Business[], business, entitlements, role,
           isOwner: role === "owner", isManager: role === "owner" || role === "manager" };
});

/** Pages réservées au propriétaire et au gérant (la base refuse aussi côté serveur). */
export async function requireManager() {
  const ctx = await getAppContext();
  if (!ctx.isManager) redirect("/app");
  return ctx;
}
export async function requireOwner() {
  const ctx = await getAppContext();
  if (!ctx.isOwner) redirect("/app");
  return ctx;
}

export const can = (e: Entitlements, feature: string) => e.features.includes(feature);
