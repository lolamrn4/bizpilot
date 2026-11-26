/** Garde-fou : tout nombre écrit par l'IA doit exister dans les faits calculés. */
const TOKEN = /\d+(?:[   .,]\d+)*/g;

/** Toutes les lectures possibles d'un nombre écrit ("1 234,5", "1,234.5", "14.29"…). */
function readings(tok: string): number[] {
  const t = tok.replace(/[   ]/g, "");
  const out = new Set<number>();
  const plain = Number(t.replace(/[.,]/g, ""));
  if (Number.isFinite(plain)) out.add(plain);
  const commaDec = Number(t.replace(/\./g, "").replace(",", "."));
  if (Number.isFinite(commaDec)) out.add(commaDec);
  const dotDec = Number(t.replace(/,/g, ""));
  if (Number.isFinite(dotDec)) out.add(dotDec);
  return [...out];
}

export function numbersIn(text: string): string[] {
  return text.match(TOKEN) ?? [];
}

export function validateNumbers(output: string, facts: string[]): { ok: boolean; unknown: string[] } {
  const allowed: number[] = [];
  for (const f of facts) for (const tok of numbersIn(f)) allowed.push(...readings(tok));
  const unknown: string[] = [];
  for (const tok of numbersIn(output)) {
    const vals = readings(tok);
    // Petits entiers (1 à 10) tolérés : énumérations (« 3 actions », « étape 1 »).
    if (vals.some((v) => Number.isInteger(v) && v >= 1 && v <= 10)) continue;
    const match = vals.some((v) => allowed.some((a) => Math.abs(a - v) <= Math.max(0.0005, Math.abs(a) * 1e-6)));
    if (!match) unknown.push(tok);
  }
  return { ok: unknown.length === 0, unknown };
}
