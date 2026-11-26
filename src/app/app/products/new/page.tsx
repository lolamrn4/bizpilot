import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/session";
import { getDict } from "@/i18n/server";
import { ProductForm } from "../ProductForm";

export default async function NewProductPage() {
  const { business, isManager } = await getAppContext();
  if (!isManager) redirect("/app/products");
  const { d } = await getDict();
  return (
    <div className="space-y-4">
      <Link href="/app/products" className="text-sm font-medium text-ink-500 hover:text-ink-800">← {d.common.back}</Link>
      <h1 className="h1">{d.products.new}</h1>
      <div className="card p-5"><ProductForm currency={business.currency} /></div>
    </div>
  );
}
