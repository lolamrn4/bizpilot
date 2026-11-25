"use client";
import { useActionState } from "react";
import { useI18n } from "@/i18n/client";
import { ActionForm, Field, FormMessage, SubmitButton } from "@/components/forms";
import { CURRENCIES } from "@/lib/money";
import { TimezoneSelect } from "@/app/onboarding/OnboardingForm";
import type { Business } from "@/lib/types";
import { changePasswordAction, updateBusinessAction, updateProfileAction } from "./actions";

export function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const { d, lang } = useI18n();
  const [state, action, pending] = useActionState(updateProfileAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-4">
      <FormMessage state={state} />
      <Field label={d.auth.email}><input className="input" value={email} disabled readOnly /></Field>
      <Field label={d.auth.fullName}><input className="input" name="full_name" defaultValue={fullName} maxLength={120} /></Field>
      <Field label={d.common.language}>
        <select className="input" name="language" defaultValue={lang}>
          <option value="fr">{d.common.french}</option>
          <option value="en">{d.common.english}</option>
        </select>
      </Field>
      <SubmitButton>{d.common.save}</SubmitButton>
    </ActionForm>
  );
}

export function BusinessForm({ business, currencyLocked }: { business: Business; currencyLocked: boolean }) {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(updateBusinessAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-4">
      <FormMessage state={state} />
      <Field label={d.onboarding.name}><input className="input" name="name" defaultValue={business.name} required maxLength={120} /></Field>
      <Field label={d.onboarding.owner}><input className="input" name="owner_name" defaultValue={business.owner_name} required maxLength={120} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={d.onboarding.sector} optional><input className="input" name="sector" defaultValue={business.sector} maxLength={80} /></Field>
        <Field label={d.onboarding.city} optional><input className="input" name="city" defaultValue={business.city} maxLength={80} /></Field>
        <Field label={d.onboarding.currency} hint={currencyLocked ? d.settings.currencyLocked : undefined}>
          {currencyLocked && <input type="hidden" name="currency" value={business.currency} />}
          <select className="input" name={currencyLocked ? undefined : "currency"} defaultValue={business.currency} disabled={currencyLocked}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{d.currencies[c]}</option>)}
          </select>
        </Field>
        <Field label={d.onboarding.timezone}><TimezoneSelect defaultValue={business.timezone} /></Field>
      </div>
      <SubmitButton>{d.common.save}</SubmitButton>
    </ActionForm>
  );
}

export function PasswordForm() {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={d.auth.newPassword} hint={d.auth.passwordHint}><input className="input" type="password" name="password" minLength={8} autoComplete="new-password" required /></Field>
        <Field label={d.auth.confirmPassword}><input className="input" type="password" name="confirm" minLength={8} autoComplete="new-password" required /></Field>
      </div>
      <SubmitButton>{d.settings.changePassword}</SubmitButton>
    </ActionForm>
  );
}
