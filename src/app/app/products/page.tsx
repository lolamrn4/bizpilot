import Link from "next/link";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { formatMoney, formatNumber } from "@/lib/money";
import type { Product } from "@/lib/types";
import { StockBadge } from "@/components/StockBadge";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; archived?: string }> }) {
  const { supabase, business } = await getAppContext();
  const { d, lang } = await getDict();
  const { q = "", archived } = await searchParams;
  let query = supabase.from("products").select("*").eq("business_id", business.id).order("name").limit(500);
  if (archived !== "1") query = query.eq("archived", false);
  const term = q.trim().replace(/[%,()]/g, " ");
  if (term) query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%,category.ilike.%${term}%`);
  const { data } = await query;
  const products = (data ?? []) as Product[];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="h1">{d.products.title}</h1>
        <Link href="/app/products/new" className="btn-primary">+ {d.products.new}</Link>
      </div>
      <form className="flex flex-wrap items-center gap-2">
        <input className="input max-w-xs flex-1" name="q" defaultValue={q} placeholder={d.products.searchPh} />
        <label className="flex items-center gap-2 text-sm text-ink-600"><input type="checkbox" name="archived" value="1" defaultChecked={archived === "1"} className="size-4 accent-brand-600" />{d.products.showArchived}</label>
        <button className="btn-secondary">{d.common.search}</button>
      </form>
      {products.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-600">{d.products.empty}</div>
      ) : (
        <div className="card divide-y divide-ink-100">
          {products.map((p) => (
            <Link key={p.id} href={`/app/products/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-ink-50">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900">{p.name}</p>
                <p className="truncate text-xs text-ink-500">{[p.category, p.sku].filter(Boolean).join(" · ") || "—"} · {formatMoney(p.sale_price, p.currency, lang)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold">{formatNumber(p.stock_quantity, lang)}</p>
                <StockBadge p={p} d={d} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
