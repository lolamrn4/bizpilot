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
const method = (v: FormDataEntryValue | null) => ((PAYMENT_METHODS as readonly string[]).includes(String(v)) ? String(v) : "cash");

function readSale(fd: FormData) {
  const product_id = String(fd.get("product_id") ?? "") || null;
  const item_name = String(fd.get("item_name") ?? "").trim().slice(0, 120);
  const quantity = parseAmount(fd.get("quantity"));
  const unit_price = parseAmount(fd.get("unit_price"));
  const sale_date = String(fd.get("sale_date") ?? "");
  if (!quantity || quantity <= 0 || unit_price === null || unit_price < 0 || !ISO.test(sale_date)) return null;
  if (!product_id && !item_name) return null;
  return {
    product_id, item_name, quantity, unit_price, sale_date,
    customer_name: String(fd.get("customer_name") ?? "").trim().slice(0, 120),
    payment_method: method(fd.get("payment_method")),
    note: String(fd.get("note") ?? "").slice(0, 500),
  };
}

export async function createSaleAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, business } = await getAppContext();
  const { d } = await getDict();
  const s = readSale(fd);
  if (!s) return { error: d.errors.required };
  const total = Math.round(s.quantity * s.unit_price * 100) / 100;
  const status = String(fd.get("status"));
  const paid = status === "paid" ? total : status === "partial" ? parseAmount(fd.get("amount_paid")) ?? 0 : 0;
  if (paid < 0 || paid > total) return { error: d.errors.BP032 };
  const { error } = await supabase.rpc("create_sale", {
    p_business: business.id, p_product: s.product_id, p_item_name: s.item_name, p_quantity: s.quantity,
    p_unit_price: s.unit_price, p_sale_date: s.sale_date, p_customer: s.customer_name,
    p_payment_method: s.payment_method, p_amount_paid: paid, p_note: s.note,
  });
  if (error) return { error: errorMessage(error, d) };
  revalidatePath("/app", "layout");
  redirect("/app/sales?created=1");
}

export async function updateSaleAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await getAppContext();
  const { d } = await getDict();
  const id = String(fd.get("id"));
  const s = readSale(fd);
  if (!s) return { error: d.errors.required };
  const { error } = await supabase.from("sales").update(s).eq("id", id);
  if (error) return { error: errorMessage(error, d) };
  revalidatePath(`/app/sales/${id}`);
  return { ok: d.common.saved };
}

export async function deleteSaleAction(fd: FormData) {
  const { supabase } = await getAppContext();
  await supabase.from("sales").delete().eq("id", String(fd.get("id")));
  revalidatePath("/app", "layout");
  redirect("/app/sales");
}

export async function addPaymentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, business } = await getAppContext();
  const { d } = await getDict();
  const sale_id = String(fd.get("sale_id"));
  const amount = parseAmount(fd.get("amount"));
  const paid_on = String(fd.get("paid_on") ?? "");
  if (!amount || amount <= 0 || !ISO.test(paid_on)) return { error: d.errors.required };
  const { error } = await supabase.from("sale_payments").insert({
    sale_id, business_id: business.id, amount, currency: business.currency, paid_on, method: method(fd.get("method")),
  });
  if (error) return { error: errorMessage(error, d) };
  revalidatePath(`/app/sales/${sale_id}`);
  return { ok: d.common.saved };
}

export async function deletePaymentAction(fd: FormData) {
  const { supabase } = await getAppContext();
  const sale = String(fd.get("sale_id"));
  await supabase.from("sale_payments").delete().eq("id", String(fd.get("id")));
  revalidatePath(`/app/sales/${sale}`);
}

export async function regenerateReceiptLinkAction(fd: FormData) {
  const { supabase } = await getAppContext();
  const id = String(fd.get("id"));
  await supabase.rpc("regenerate_receipt_link", { p_sale: id });
  revalidatePath(`/app/sales/${id}`);
}
