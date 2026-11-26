import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client « service_role » : contourne la RLS. Réservé au webhook de paiement et à l'espace admin,
 * toujours côté serveur. La clé n'est JAMAIS exposée au navigateur (pas de préfixe NEXT_PUBLIC_).
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
