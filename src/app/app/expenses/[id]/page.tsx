import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppContext, can } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { todayIn } from "@/lib/periods";
import { ConfirmButton } from "@/components/forms";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { ExpenseForm } from "../ExpenseForm";
import { deleteExpenseAction } from "../actions";

export default async function ExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, business, entitlements } = await getAppContext();
  const { d } = await getDict();
  const { data } = await supabase.from("expenses").select("*").eq("id", id).eq("business_id", business.id).maybeSingle();
  if (!data) notFound();
  const e = data as Expense;
  const { data: cats } = await supabase.from("expense_categories").select("id, business_id, code, name").order("created_at");
  let receiptUrl: string | null = null;
  if (e.receipt_path) {
    const { data: signed } = await supabase.storage.from("receipts").createSignedUrl(e.receipt_path, 300);
    receiptUrl = signed?.signedUrl ?? null;
  }
  return (
    <div className="space-y-4">
      <Link href="/app/expenses" className="text-sm font-medium text-ink-500 hover:text-ink-800">← {d.common.back}</Link>
      <h1 className="h1">{d.expenses.editTitle}</h1>
      <div className="card p-5"><ExpenseForm expense={e} receiptUrl={receiptUrl} categories={(cats ?? []) as ExpenseCategory[]} currency={business.currency} today={todayIn(business.timezone)} businessId={business.id} receiptsAllowed={can(entitlements, "receipts")} /></div>
      <div className="card p-5"><form action={deleteExpenseAction}><input type="hidden" name="id" value={e.id} /><ConfirmButton>{d.expenses.deleteExpense}</ConfirmButton></form></div>
    </div>
  );
}
