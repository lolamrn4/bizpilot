import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Lecture seule de l'état d'abonnement (utilisée après le paiement pour attendre la confirmation du webhook). */
export async function GET() {
  const { supabase } = await getAppContext();
  const { data } = await supabase.rpc("my_billing");
  return NextResponse.json(data ?? {}, { headers: { "cache-control": "no-store" } });
}
