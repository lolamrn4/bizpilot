"use client";
import { useActionState } from "react";
import { useI18n } from "@/i18n/client";
import { ActionForm, Field, FormMessage, SubmitButton } from "@/components/forms";
import { createCustomerAction, updateCustomerAction } from "./actions";

export function CustomerForm({ customer }: { customer?: { id: string; name: string; phone: string; note: string } }) {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(customer ? updateCustomerAction : createCustomerAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-4">
      <FormMessage state={state} />
      {customer && <input type="hidden" name="id" value={customer.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={d.customers.name}><input className="input" name="name" defaultValue={customer?.name} required maxLength={120} /></Field>
        <Field label={d.customers.phone} optional hint={d.customers.phoneHint}><input className="input" name="phone" defaultValue={customer?.phone} maxLength={40} inputMode="tel" placeholder="+224 6xx xx xx xx" /></Field>
      </div>
      <Field label={d.common.note} optional><textarea className="input" name="note" rows={2} defaultValue={customer?.note} maxLength={300} /></Field>
      <SubmitButton>{customer ? d.common.save : d.customers.create}</SubmitButton>
    </ActionForm>
  );
}
