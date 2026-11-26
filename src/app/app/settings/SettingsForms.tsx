"use client";
import { useActionState } from "react";
import { useI18n } from "@/i18n/client";
import { ActionForm, Field, FormMessage, LockNote, SubmitButton } from "@/components/forms";
import { CURRENCIES } from "@/lib/money";
import { TimezoneSelect } from "@/app/onboarding/OnboardingForm";
import type { Business } from "@/lib/types";
import { changePasswordAction, updateBusinessAction, updateProfileAction, updateReceiptAction } from "./actions";

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
      <fieldset className="rounded-2xl border border-ink-100 p-4">
        <legend className="px-1 text-sm font-semibold text-ink-800">{d.settings.calc}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={d.settings.targetMargin} hint={d.settings.targetMarginHint}><input className="input" name="target_margin" type="number" min="0" max="94" step="0.1" defaultValue={Math.round(Number(business.target_margin ?? 0.3) * 1000) / 10} required /></Field>
          <Field label={d.settings.minMargin} hint={d.settings.minMarginHint}><input className="input" name="min_margin" type="number" min="0" max="94" step="0.1" defaultValue={Math.round(Number(business.min_margin ?? 0.1) * 1000) / 10} required /></Field>
          <Field label={`${d.settings.openingBalance} (${business.currency})`} hint={d.settings.openingBalanceHint} optional><input className="input" name="cash_opening_balance" type="number" step="any" inputMode="decimal" defaultValue={business.cash_opening_balance ?? ""} /></Field>
          <Field label={d.settings.openingDate} optional><input className="input" name="cash_opening_date" type="date" defaultValue={business.cash_opening_date ?? ""} /></Field>
        </div>
      </fieldset>
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

export function ReceiptForm({ business, branded, logoUrl }: { business: Business; branded: boolean; logoUrl: string | null }) {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(updateReceiptAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-4">
      <FormMessage state={state} />
      <p className="text-sm text-ink-500">{d.receipt.settingsIntro}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={d.receipt.phone} optional><input className="input" name="phone" defaultValue={business.phone ?? ""} maxLength={40} inputMode="tel" /></Field>
        <Field label={d.receipt.taxIdLabel} optional hint={d.receipt.taxIdHint}><input className="input" name="tax_id" defaultValue={business.tax_id ?? ""} maxLength={60} /></Field>
      </div>
      <Field label={d.receipt.address} optional><input className="input" name="address" defaultValue={business.address ?? ""} maxLength={200} /></Field>
      {branded ? (
        <>
          <Field label={d.receipt.footer} optional hint={d.receipt.footerHint}>
            <textarea className="input min-h-20" name="receipt_footer" defaultValue={business.receipt_footer ?? ""} maxLength={300} />
          </Field>
          <Field label={d.receipt.logo} optional hint={d.receipt.logoHint}>
            <div className="flex flex-wrap items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logoUrl && <img src={logoUrl} alt="" className="h-12 w-auto max-w-28 rounded border border-ink-100 object-contain" data-testid="logo-preview" />}
              <input type="file" name="logo" accept="image/png,image/jpeg" className="text-sm" />
            </div>
          </Field>
        </>
      ) : (
        <LockNote text={d.receipt.brandLocked} />
      )}
      <SubmitButton>{d.common.save}</SubmitButton>
    </ActionForm>
  );
}
