"use client";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "@/i18n/client";
import { formatMoney } from "@/lib/money";

type Point = { bucket: string; revenue: number; expenses: number; collected: number };

export function RevenueExpenseChart({ data, currency, bucket }: { data: Point[]; currency: string; bucket: "day" | "month" }) {
  const { d, lang } = useI18n();
  const loc = lang === "fr" ? "fr-FR" : "en-US";
  const label = (iso: string) => {
    const [y, m, dd] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, dd));
    return bucket === "day"
      ? new Intl.DateTimeFormat(loc, { day: "2-digit", month: "short", timeZone: "UTC" }).format(dt)
      : new Intl.DateTimeFormat(loc, { month: "short", year: "2-digit", timeZone: "UTC" }).format(dt);
  };
  const compact = (v: number) => new Intl.NumberFormat(loc, { notation: "compact", maximumFractionDigits: 1 }).format(v);
  const rows = data.map((p) => ({ ...p, revenue: Number(p.revenue), expenses: Number(p.expenses), label: label(p.bucket) }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="#eeeef0" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b6b75" }} interval="preserveStartEnd" minTickGap={12} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b6b75" }} tickFormatter={compact} width={48} />
          <Tooltip
            cursor={{ fill: "#fdf2f7" }}
            formatter={(v) => formatMoney(Number(v), currency, lang)}
            contentStyle={{ borderRadius: 12, border: "1px solid #eeeef0", fontSize: 12 }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="revenue" name={d.dashboard.revenue} fill="#c92c6b" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expenses" name={d.dashboard.expenses} fill="#8f8f99" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
