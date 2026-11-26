import "server-only";

/**
 * Couche IA — rôle limité : reformuler et prioriser des faits déjà calculés.
 * Garde-fou : tout nombre présent dans la réponse doit exister dans les faits fournis,
 * sinon la réponse est rejetée et remplacée par le texte standard (déterministe).
 */

export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

export { validateNumbers } from "./ai-guard";

const SYSTEM = {
  fr: `Tu es le conseiller de gestion de l'application Biz Pilot Digital. Tu t'adresses à un commerçant qui ne connaît rien à la comptabilité.
Règles absolues :
- Utilise UNIQUEMENT les chiffres présents dans les FAITS, recopiés exactement comme écrits (même format). N'invente aucun chiffre, aucun pourcentage, aucune date.
- Ne fais AUCUN calcul (pas d'addition, pas de moyenne, pas de pourcentage nouveau).
- Ne promets rien : les gains sont des estimations.
- Si une information manque, dis-le simplement.
Format : 120 à 180 mots, en français simple, sans titres ni tableaux. Commence par l'essentiel, puis termine par les actions prioritaires (au plus 3, une par ligne commençant par « • »).`,
  en: `You are the business advisor of the Biz Pilot Digital app. You speak to a shop owner who knows nothing about accounting.
Absolute rules:
- Use ONLY the figures present in the FACTS, copied exactly as written (same format). Never invent a figure, percentage or date.
- Do NOT calculate anything (no sums, averages or new percentages).
- Promise nothing: gains are estimates.
- If information is missing, say so plainly.
Format: 120 to 180 words, plain English, no headings or tables. Start with the key point, then end with the priority actions (at most 3, one per line starting with "• ").`,
};

export async function explainWithAi(kind: string, lang: "fr" | "en", facts: string[]) {
  const base = (process.env.BIZPILOT_AI_BASE_URL ?? "https://api.anthropic.com").replace(/\/$/, "");
  const res = await fetch(`${base}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.BIZPILOT_AI_MODEL ?? "claude-haiku-5-5",
      max_tokens: 700,
      temperature: 0.2,
      system: SYSTEM[lang],
      messages: [{ role: "user", content: `${lang === "fr" ? "SUJET" : "TOPIC"} : ${kind}\n\n${lang === "fr" ? "FAITS" : "FACTS"} :\n- ${facts.join("\n- ")}` }],
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`AI HTTP ${res.status}`);
  const json = (await res.json()) as { content?: { type: string; text?: string }[]; usage?: { input_tokens?: number; output_tokens?: number } };
  const text = (json.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("").trim();
  return { text, usage: json.usage ?? {} };
}
