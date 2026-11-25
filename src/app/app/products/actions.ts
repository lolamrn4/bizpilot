"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { errorMessage } from "@/lib/errors";
import { parseAmount } from "@/lib/money";
import type { ActionState } from "@/components/forms";

const COSTS = ["purchase_price", "transport_cost", "packaging_cost", "delivery_cost", "transaction_fee", "other_cost", "sale_price"] as const;

function readProduct(fd: FormData) {
  const out: Record<string, string | number> = {
    name: String(fd.get("name") ?? "").trim(),
    category: String(fd.get("category") ?? "").trim(),
    sku: String(fd.get("sku") ?? "").trim(),
  };
  for (const k of [...COSTS, "low_stock_threshold"]) {
    const v = parseAmount(fd.get(k));
    if (v === null) out[k] = 0;
    else if (v < 0 || !Number.isFinite(v)) return null;
    else out[k] = v;
  }
  return out;
}

export async function createProductAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, business } = await getAppContext();
  const { d } = await getDict();
  const p = readProduct(fd);
  const stock = parseAmount(fd.get("stock_quantity")) ?? 0;
  if (!p || !p.name) return { error: d.errors.required };
  if (stock < 0) return { error: d.errors.BP021 };
  const { data, error } = await supabase
    .from("products")
    .insert({ ...p, stock_quantity: stock, business_id: business.id, currency: business.currency })
    .select("id")
    .single();
  if (error) return { error: errorMessage(error, d) };
  revalidatePath("/app/products");
  redirect(`/app/products/${data.id}`);
}

export async function updateProductAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await getAppContext();
  const { d } = await getDict();
  const id = String(fd.get("id"));
  const p = readProduct(fd);
  if (!p || !p.name) return { error: d.errors.required };
  const { error } = await supabase.from("products").update(p).eq("id", id);
  if (error) return { error: errorMessage(error, d) };
  revalidatePath(`/app/products/${id}`);
  return { ok: d.common.saved };
}

export async function toggleArchiveAction(fd: FormData) {
  const { supabase } = await getAppContext();
  const id = String(fd.get("id"));
  await supabase.from("products").update({ archived: fd.get("archived") === "true" }).eq("id", id);
  revalidatePath(`/app/products/${id}`);
}

export async function deleteProductAction(fd: FormData) {
  const { supabase } = await getAppContext();
  await supabase.from("products").delete().eq("id", String(fd.get("id")));
  revalidatePath("/app/products");
  redirect("/app/products");
}

export async function addMovementAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await getAppContext();
  const { d } = await getDict();
  const id = String(fd.get("product_id"));
  const qty = parseAmount(fd.get("quantity"));
  if (qty === null || qty === 0) return { error: d.errors.number };
  const { error } = await supabase.rpc("add_stock_movement", {
    p_product: id, p_kind: String(fd.get("kind")), p_quantity: qty, p_note: String(fd.get("note") ?? "").slice(0, 300),
  });
  if (error) return { error: errorMessage(error, d) };
  revalidatePath(`/app/products/${id}`);
  return { ok: d.common.saved };
}
