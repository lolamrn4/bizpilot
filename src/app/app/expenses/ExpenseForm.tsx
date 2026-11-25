"use client";
import { useActionState, useState } from "react";
import { useI18n } from "@/i18n/client";
import { ActionForm, Field, FormMessage, LockNote, SubmitButton } from "@/components/forms";
import { createClient } from "@/lib/supabase/client";
import { DECIMALS, type Currency } from "@/lib/money";
import { PAYMENT_METHODS, type Expense, type ExpenseCategory } from "@/lib/types";
import { createExpenseAction, updateExpenseAction } from "./actions";

const MAX = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function ExpenseForm({ categories, currency, today, businessId, receiptsAllowed, expense, receiptUrl }: {
  categories: ExpenseCategory[]; currency: string; today: string; businessId: string; receiptsAllowed: boolean; expense?: Expense; receiptUrl?: string | null;
}) {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(expense ? updateExpenseAction : createExpenseAction, undefined);
  const [cat, setCat] = useState(expense?.category_id ?? "");
  const [path, setPath] = useState("");
  const [upload, setUpload] = useState<"idle" | "busy" | "error">("idle");
  const step = DECIMALS[currency as Currency] === 0 ? "1" : "0.01";
  const label = (c: ExpenseCategory) => (c.code ? d.categories[c.code as keyof typeof d.categories] : c.name);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setPath("");
    if (!f) return;
    if (f.size > MAX || !TYPES.includes(f.type)) { setUpload("error"); e.target.value = ""; return; }
    setUpload("busy");
    const ext = f.type === "application/pdf" ? "pdf" : f.type.split("/")[1];
    const key = `${businessId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await createClient().storage.from("receipts").upload(key, f, { contentType: f.type, upsert: false });
    if (error) { setUpload("error"); e.target.value = ""; return; }
    setPath(key);
    setUpload("idle");
  }

  return (
    <ActionForm action={action} pending={pending} className="space-y-4">
      <FormMessage state={state} />
      {expense && <input type="hidden" name="id" value={expense.id} />}
      <Field label={d.expenses.name}><input className="input" name="name" defaultValue={expense?.name} placeholder={d.expenses.namePh} required maxLength={120} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={d.expenses.category}>
          <select className="input" name="category_id" value={cat} onChange={(e) => setCat(e.target.value)} required>
            <option value="" disabled>—</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{label(c)}</option>)}
            <option value="__new">+ {d.expenses.newCategory}</option>
          </select>
        </Field>
        {cat === "__new" && <Field label={d.expenses.newCategory}><input className="input" name="new_category" placeholder={d.expenses.newCategoryPh} required maxLength={60} /></Field>}
        <Field label={`${d.common.amount} (${currency})`}><input className="input" name="amount" type="number" min="0" step={step} inputMode="decimal" defaultValue={expense?.amount} required /></Field>
        <Field label={d.common.date}><input className="input" name="expense_date" type="date" defaultValue={expense?.expense_date ?? today} required /></Field>
        <Field label={d.sales.paymentMethod}>
          <select className="input" name="payment_method" defaultValue={expense?.payment_method ?? "cash"}>{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{d.methods[m]}</option>)}</select>
        </Field>
      </div>
      <div>
        <span className="label">{d.expenses.receipt} <span className="font-normal text-ink-400">({d.common.optional})</span></span>
        {receiptUrl && (
          <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
            <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 hover:underline">{d.expenses.receiptView}</a>
            <label className="flex items-center gap-1.5 text-ink-600"><input type="checkbox" name="remove_receipt" className="size-4 accent-brand-600" />{d.expenses.receiptRemove}</label>
          </div>
        )}
        {receiptsAllowed ? (
          <>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" capture="environment" onChange={onFile} className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-semibold file:text-brand-700" />
            <input type="hidden" name="receipt_path" value={path} />
            <p className="hint">{upload === "busy" ? d.expenses.uploading : d.expenses.receiptHint}</p>
            {upload === "error" && <p className="alert-error mt-2">{d.expenses.uploadError}</p>}
          </>
        ) : <LockNote text={d.expenses.receiptLocked} />}
      </div>
      <Field label={d.common.note} optional><textarea className="input" name="note" rows={2} defaultValue={expense?.note} maxLength={500} /></Field>
      {upload === "busy" ? <button className="btn-primary" disabled>{d.expenses.uploading}</button> : <SubmitButton className="btn-primary w-full sm:w-auto">{d.common.save}</SubmitButton>}
    </ActionForm>
  );
}
