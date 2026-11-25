export const PERIODS = ["today", "week", "month", "quarter", "year", "custom"] as const;
export type Period = (typeof PERIODS)[number];

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Date du jour (AAAA-MM-JJ) dans le fuseau horaire de l'entreprise. */
export function todayIn(tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return parts; // en-CA => AAAA-MM-JJ
}

function shift(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function resolvePeriod(
  tz: string,
  period: string | undefined,
  from?: string,
  to?: string,
): { period: Period; from: string; to: string } {
  const today = todayIn(tz);
  const [y, m] = today.split("-").map(Number);
  const p = (PERIODS as readonly string[]).includes(period ?? "") ? (period as Period) : "month";
  switch (p) {
    case "today":
      return { period: p, from: today, to: today };
    case "week": {
      const dow = new Date(today + "T00:00:00Z").getUTCDay(); // 0 = dimanche
      return { period: p, from: shift(today, -((dow + 6) % 7)), to: today };
    }
    case "quarter": {
      const qm = Math.floor((m - 1) / 3) * 3 + 1;
      return { period: p, from: `${y}-${String(qm).padStart(2, "0")}-01`, to: today };
    }
    case "year":
      return { period: p, from: `${y}-01-01`, to: today };
    case "custom":
      if (from && to && ISO.test(from) && ISO.test(to)) return { period: p, from, to };
      return { period: "month", from: `${today.slice(0, 7)}-01`, to: today };
    default:
      return { period: "month", from: `${today.slice(0, 7)}-01`, to: today };
  }
}
