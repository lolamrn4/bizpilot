import Link from "next/link";
import { getAppContext, can } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { todayIn } from "@/lib/periods";
import type { ExpenseCategory } from "@/lib/types";
import { ExpenseForm } from "../ExpenseForm";

export default async function NewExpensePage() {
  const { supabase, business, entitlements } = await getAppContext();
  const { d } = await getDict();
  const { data } = await supabase.from("expense_categories").select("id, business_id, code, name").order("created_at");
  return (
    <div className="space-y-4">
      <Link href="/app/expenses" className="text-sm font-medium text-ink-500 hover:text-ink-800">← {d.common.back}</Link>
      <h1 className="h1">{d.expenses.new}</h1>
      <div className="card p-5"><ExpenseForm categories={(data ?? []) as ExpenseCategory[]} currency={business.currency} today={todayIn(business.timezone)} businessId={business.id} receiptsAllowed={can(entitlements, "receipts")} /></div>
    </div>
  );
}
