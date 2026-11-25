import type { Dict } from "@/i18n";

/** Traduit une erreur Supabase/PostgreSQL en message clair pour l'utilisateur. */
export function errorMessage(err: { message?: string; code?: string } | null | undefined, d: Dict): string {
  const msg = err?.message ?? "";
  const m = msg.match(/BP\d{3}/);
  if (m && m[0] in d.errors) return d.errors[m[0] as keyof Dict["errors"]];
  if (err?.code === "23505") return d.errors.duplicateCategory;
  if (/row-level security|permission denied/i.test(msg)) return d.errors.BP090;
  return d.common.unexpected;
}
