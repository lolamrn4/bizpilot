import Link from "next/link";
import { getAppContext, can } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { todayIn } from "@/lib/periods";
import { SaleForm } from "../SaleForm";

export default async function NewSalePage() {
  const { supabase, business, entitlements } = await getAppContext();
  const { d } = await getDict();
  const { data: cust } = await supabase.from("customers").select("name").eq("business_id", business.id).order("name").limit(1000);
  const { data } = await supabase.from("products").select("id, name, sale_price, stock_quantity, unit_cost").eq("business_id", business.id).eq("archived", false).order("name");
  return (
    <div className="space-y-4">
      <Link href="/app/sales" className="text-sm font-medium text-ink-500 hover:text-ink-800">← {d.common.back}</Link>
      <h1 className="h1">{d.sales.new}</h1>
      <div className="card p-5"><SaleForm products={data ?? []} currency={business.currency} today={todayIn(business.timezone)} partialAllowed={can(entitlements, "partial_payments")} minMargin={Number(business.min_margin ?? 0.1)} customers={(cust ?? []).map((c) => c.name)} /></div>
    </div>
  );
}
