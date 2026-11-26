import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export type PaddleEnv = "sandbox" | "production";
export const paddleEnv = (): PaddleEnv => ((process.env.NEXT_PUBLIC_PADDLE_ENV || process.env.PADDLE_ENV) === "production" ? "production" : "sandbox");

/** Tous les réglages nécessaires sont-ils présents ? (on ne renvoie jamais leurs valeurs) */
export function billingStatus() {
  return {
    apiKey: Boolean(process.env.PADDLE_API_KEY),
    webhookSecret: Boolean(process.env.PADDLE_WEBHOOK_SECRET),
    clientToken: Boolean(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN),
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    env: paddleEnv(),
  };
}
export const billingConfigured = () => {
  const s = billingStatus();
  return s.apiKey && s.webhookSecret && s.clientToken && s.serviceRole;
};

const apiBase = () =>
  (process.env.BIZPILOT_PADDLE_API_BASE ?? (paddleEnv() === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com")).replace(/\/$/, "");

export class PaddleError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export async function paddle<T = unknown>(method: "GET" | "POST" | "PATCH", path: string, body?: unknown): Promise<T> {
  const res = await fetch(apiBase() + path, {
    method,
    headers: { authorization: `Bearer ${process.env.PADDLE_API_KEY}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { data?: T; error?: { code?: string; detail?: string } };
  if (!res.ok) throw new PaddleError(res.status, json.error?.code ?? "http_error", json.error?.detail ?? `HTTP ${res.status}`);
  return json.data as T;
}

/**
 * Vérifie l'en-tête Paddle-Signature : « ts=<unix>;h1=<hex> » (plusieurs h1 possibles pendant une rotation de secret).
 * Signature = HMAC-SHA256(secret, `${ts}:${corps brut}`). Fenêtre anti-rejeu : 5 minutes.
 */
export function verifyPaddleSignature(rawBody: string, header: string | null, secret: string, nowSec = Math.floor(Date.now() / 1000), toleranceSec = 300) {
  if (!header || !secret) return false;
  const parts = header.split(";").map((p) => p.trim());
  const ts = parts.find((p) => p.startsWith("ts="))?.slice(3);
  const sigs = parts.filter((p) => p.startsWith("h1=")).map((p) => p.slice(3));
  if (!ts || !/^\d+$/.test(ts) || sigs.length === 0) return false;
  if (Math.abs(nowSec - Number(ts)) > toleranceSec) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex"), "utf8");
  return sigs.some((s) => {
    const got = Buffer.from(s, "utf8");
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}
