import "server-only";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/env";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Client Supabase côté serveur, au nom de l'utilisateur connecté (RLS appliquée). */
export async function createClient() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* appelé depuis un Server Component : le middleware rafraîchit la session */
        }
      },
    },
  });
}
