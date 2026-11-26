import { NextResponse, type NextRequest } from "next/server";
import { verifyPaddleSignature, paddleEnv } from "@/lib/paddle";
import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PaddleEvent = { event_id?: string; event_type?: string; occurred_at?: string; data?: Record<string, unknown> };

/**
 * Webhook Paddle — SEULE source de vérité pour activer, modifier ou couper une formule.
 * 1) signature vérifiée sur le corps brut ; 2) idempotence en base ; 3) application de l'état.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.PADDLE_WEBHOOK_SECRET ?? "";
  if (!verifyPaddleSignature(raw, req.headers.get("paddle-signature"), secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  let evt: PaddleEvent;
  try { evt = JSON.parse(raw); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  if (!evt.event_id || !evt.event_type || !evt.data) return NextResponse.json({ error: "invalid event" }, { status: 400 });

  const db = createServiceClient();
  const occurred = evt.occurred_at ?? new Date().toISOString();
  const { data, error } = evt.event_type.startsWith("subscription.")
    ? await db.rpc("apply_paddle_subscription", { p_event_id: evt.event_id, p_event_type: evt.event_type, p_occurred_at: occurred, p_data: evt.data, p_environment: paddleEnv() })
    : await db.rpc("log_billing_event", { p_event_id: evt.event_id, p_event_type: evt.event_type, p_occurred_at: occurred, p_data: evt.data });
  if (error) {
    console.error("[billing-webhook] processing failed", evt.event_type, error.code, error.message);
    // Erreur technique (base indisponible…) : 500 pour que Paddle renvoie l'événement plus tard.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
  // Erreurs métier (prix/compte inconnu) : journalisées en base, 200 pour éviter des renvois inutiles.
  return NextResponse.json({ result: data });
}
