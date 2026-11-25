import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Sauvegarde complète des données de l'entreprise (toutes formules) — lecture sous RLS. */
export async function GET() {
  const { supabase, business } = await getAppContext();
  const b = business.id;
  const [products, movements, sales, payments, expenses, categories] = await Promise.all([
    supabase.from("products").select("*").eq("business_id", b),
    supabase.from("stock_movements").select("*").eq("business_id", b),
    supabase.from("sales").select("*").eq("business_id", b),
    supabase.from("sale_payments").select("*").eq("business_id", b),
    supabase.from("expenses").select("*").eq("business_id", b),
    supabase.from("expense_categories").select("*").eq("business_id", b),
  ]);
  const body = {
    format: "bizpilot-backup", version: 1, exported_at: new Date().toISOString(), business,
    products: products.data, stock_movements: movements.data, sales: sales.data, sale_payments: payments.data,
    expenses: expenses.data, custom_expense_categories: categories.data,
  };
  const name = `bizpilot_backup_${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="${name}"`, "cache-control": "no-store" },
  });
}
