import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { formatDate, formatNumber } from "@/lib/money";
import { ConfirmButton } from "@/components/forms";
import type { Product } from "@/lib/types";
import { MovementForm, ProductForm } from "../ProductForm";
import { deleteProductAction, toggleArchiveAction } from "../actions";
import { StockBadge } from "@/components/StockBadge";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, business } = await getAppContext();
  const { d, lang } = await getDict();
  const { data } = await supabase.from("products").select("*").eq("id", id).eq("business_id", business.id).maybeSingle();
  if (!data) notFound();
  const p = data as Product;
  const { data: moves } = await supabase.from("stock_movements").select("id, kind, quantity, note, created_at").eq("product_id", id).order("created_at", { ascending: false }).limit(100);
  return (
    <div className="space-y-5">
      <Link href="/app/products" className="text-sm font-medium text-ink-500 hover:text-ink-800">← {d.common.back}</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h1">{p.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-ink-600">{d.products.stock} : <b>{formatNumber(p.stock_quantity, lang)}</b> <StockBadge p={p} d={d} /></p>
        </div>
        <form action={toggleArchiveAction}>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="archived" value={String(!p.archived)} />
          <button className="btn-secondary">{p.archived ? d.products.unarchive : d.products.archive}</button>
        </form>
      </div>
      <section className="card p-5"><h2 className="h2 mb-4">{d.products.addMovement}</h2><MovementForm productId={p.id} /></section>
      <section className="card p-5"><h2 className="h2 mb-4">{d.products.editTitle}</h2><ProductForm product={p} currency={business.currency} /></section>
      <section className="card p-5">
        <h2 className="h2 mb-3">{d.products.movements}</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{d.common.date}</th><th>{d.common.filter}</th><th className="text-right">{d.products.movementQty}</th><th>{d.common.note}</th></tr></thead>
            <tbody>
              {(moves ?? []).map((m) => (
                <tr key={m.id}>
                  <td>{formatDate(m.created_at, lang)}</td>
                  <td>{d.products.kinds[m.kind as keyof typeof d.products.kinds]}</td>
                  <td className={`text-right font-semibold ${m.quantity < 0 ? "text-red-700" : "text-emerald-700"}`}>{m.quantity > 0 ? "+" : ""}{formatNumber(m.quantity, lang)}</td>
                  <td className="text-ink-500">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card p-5">
        <p className="mb-3 text-sm text-ink-500">{d.products.deleteHint}</p>
        <form action={deleteProductAction}><input type="hidden" name="id" value={p.id} /><ConfirmButton>{d.products.deleteProduct}</ConfirmButton></form>
      </section>
    </div>
  );
}
