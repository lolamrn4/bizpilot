import Link from "next/link";
import { getAppContext, can } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { todayIn } from "@/lib/periods";
import { SaleForm } from "../SaleForm";

export default async function NewSalePage() {
  const { supabase, business, entitlements } = await getAppContext();
  const { d } = await getDict();
  const { data } = await supabase.from("products").select("id, name, sale_price, stock_quantity").eq("business_id", business.id).eq("archived", false).order("name");
  return (
    <div className="space-y-4">
      <Link href="/app/sales" className="text-sm font-medium text-ink-500 hover:text-ink-800">← {d.common.back}</Link>
      <h1 className="h1">{d.sales.new}</h1>
      <div className="card p-5"><SaleForm products={data ?? []} currency={business.currency} today={todayIn(business.timezone)} partialAllowed={can(entitlements, "partial_payments")} /></div>
    </div>
  );
}
