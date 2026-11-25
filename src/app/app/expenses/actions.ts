"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { errorMessage } from "@/lib/errors";
import { parseAmount } from "@/lib/money";
import { PAYMENT_METHODS } from "@/lib/types";
import type { ActionState } from "@/components/forms";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

async function readExpense(fd: FormData) {
  const { supabase, business } = await getAppContext();
  const { d } = await getDict();
  const name = String(fd.get("name") ?? "").trim().slice(0, 120);
  const amount = parseAmount(fd.get("amount"));
  const expense_date = String(fd.get("expense_date") ?? "");
  let category_id = String(fd.get("category_id") ?? "");
  if (!name || !amount || amount <= 0 || !ISO.test(expense_date) || !category_id) return { error: d.errors.required };
  if (category_id === "__new") {
    const catName = String(fd.get("new_category") ?? "").trim().slice(0, 60);
    if (!catName) return { error: d.errors.required };
    const { data: existing } = await supabase.from("expense_categories").select("id").eq("business_id", business.id).ilike("name", catName).maybeSingle();
    if (existing) category_id = existing.id;
    else {
      const { data, error } = await supabase.from("expense_categories").insert({ business_id: business.id, name: catName }).select("id").single();
      if (error) return { error: errorMessage(error, d) };
      category_id = data.id;
    }
  }
  const pm = String(fd.get("payment_method"));
  const receipt = String(fd.get("receipt_path") ?? "") || null;
  return {
    row: {
      name, amount, expense_date, category_id,
      payment_method: (PAYMENT_METHODS as readonly string[]).includes(pm) ? pm : "cash",
      note: String(fd.get("note") ?? "").slice(0, 500),
      ...(receipt ? { receipt_path: receipt } : {}),
      ...(fd.get("remove_receipt") === "on" ? { receipt_path: null } : {}),
    },
  };
}

export async function createExpenseAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, business } = await getAppContext();
  const { d } = await getDict();
  const r = await readExpense(fd);
  if ("error" in r) return { error: r.error };
  const { error } = await supabase.from("expenses").insert({ ...r.row, business_id: business.id, currency: business.currency });
  if (error) return { error: errorMessage(error, d) };
  revalidatePath("/app", "layout");
  redirect("/app/expenses?created=1");
}

export async function updateExpenseAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, business } = await getAppContext();
  const { d } = await getDict();
  const id = String(fd.get("id"));
  const r = await readExpense(fd);
  if ("error" in r) return { error: r.error };
  const { data: before } = await supabase.from("expenses").select("receipt_path").eq("id", id).single();
  const { error } = await supabase.from("expenses").update(r.row).eq("id", id).eq("business_id", business.id);
  if (error) return { error: errorMessage(error, d) };
  // Ancien justificatif remplacé ou retiré : on supprime le fichier.
  if (before?.receipt_path && "receipt_path" in r.row && r.row.receipt_path !== before.receipt_path) {
    await supabase.storage.from("receipts").remove([before.receipt_path]);
  }
  revalidatePath(`/app/expenses/${id}`);
  return { ok: d.common.saved };
}

export async function deleteExpenseAction(fd: FormData) {
  const { supabase } = await getAppContext();
  const id = String(fd.get("id"));
  const { data } = await supabase.from("expenses").select("receipt_path").eq("id", id).single();
  await supabase.from("expenses").delete().eq("id", id);
  if (data?.receipt_path) await supabase.storage.from("receipts").remove([data.receipt_path]);
  revalidatePath("/app", "layout");
  redirect("/app/expenses");
}
