"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { errorMessage } from "@/lib/errors";
import type { ActionState } from "@/components/forms";

function readCustomer(fd: FormData) {
  return {
    name: String(fd.get("name") ?? "").trim().slice(0, 120),
    phone: String(fd.get("phone") ?? "").trim().slice(0, 40),
    note: String(fd.get("note") ?? "").trim().slice(0, 300),
  };
}

export async function createCustomerAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, business } = await getAppContext();
  const { d } = await getDict();
  const c = readCustomer(fd);
  if (!c.name) return { error: d.errors.required };
  const { data, error } = await supabase.from("customers").insert({ ...c, business_id: business.id }).select("id").single();
  if (error) return { error: error.code === "23505" ? d.customers.duplicate : errorMessage(error, d) };
  revalidatePath("/app/customers");
  redirect(`/app/customers/${data.id}`);
}

export async function updateCustomerAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, business } = await getAppContext();
  const { d } = await getDict();
  const id = String(fd.get("id"));
  const c = readCustomer(fd);
  if (!c.name) return { error: d.errors.required };
  const { error } = await supabase.from("customers").update(c).eq("id", id).eq("business_id", business.id);
  if (error) return { error: error.code === "23505" ? d.customers.duplicate : errorMessage(error, d) };
  revalidatePath(`/app/customers/${id}`);
  return { ok: d.common.saved };
}

export async function deleteCustomerAction(fd: FormData) {
  const { supabase, business, isManager } = await getAppContext();
  if (!isManager) return;
  await supabase.from("customers").delete().eq("id", String(fd.get("id"))).eq("business_id", business.id);
  revalidatePath("/app/customers");
  redirect("/app/customers");
}
