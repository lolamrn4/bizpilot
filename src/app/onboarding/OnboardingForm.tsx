"use client";
import { useActionState, useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";
import { ActionForm, Field, FormMessage, SubmitButton } from "@/components/forms";
import { CURRENCIES } from "@/lib/money";
import { createBusinessAction } from "./actions";

export function TimezoneSelect({ name = "timezone", defaultValue }: { name?: string; defaultValue?: string }) {
  const [zones, setZones] = useState<string[]>(defaultValue ? [defaultValue] : []);
  const [value, setValue] = useState(defaultValue ?? "");
  useEffect(() => {
    const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
    const guess = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setZones(Array.from(new Set([...(defaultValue ? [defaultValue] : []), ...list, ...(guess ? [guess] : []), "UTC"])).sort());
    if (!defaultValue && guess) setValue(guess);
  }, [defaultValue]);
  return (
    <select className="input" name={name} value={value} onChange={(e) => setValue(e.target.value)} required>
      {zones.map((z) => <option key={z} value={z}>{z.replaceAll("_", " ")}</option>)}
    </select>
  );
}

export function OnboardingForm({ ownerName }: { ownerName: string }) {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(createBusinessAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-4">
      <FormMessage state={state} />
      <Field label={d.onboarding.name}><input className="input" name="name" required maxLength={120} /></Field>
      <Field label={d.onboarding.owner}><input className="input" name="owner_name" defaultValue={ownerName} required maxLength={120} /></Field>
      <Field label={d.onboarding.sector} optional><input className="input" name="sector" placeholder={d.onboarding.sectorPh} maxLength={80} /></Field>
      <Field label={d.onboarding.city} optional><input className="input" name="city" maxLength={80} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={d.onboarding.currency}>
          <select className="input" name="currency" defaultValue="" required>
            <option value="" disabled>{d.onboarding.chooseCurrency}</option>
            {CURRENCIES.map((c) => <option key={c} value={c}>{d.currencies[c]}</option>)}
          </select>
        </Field>
        <Field label={d.onboarding.timezone}><TimezoneSelect /></Field>
      </div>
      <SubmitButton className="btn-primary w-full">{d.onboarding.create}</SubmitButton>
    </ActionForm>
  );
}
