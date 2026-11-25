"use client";
import Link from "next/link";
import { useActionState } from "react";
import { useI18n } from "@/i18n/client";
import { ActionForm, Field, FormMessage, SubmitButton } from "@/components/forms";
import { forgotAction, loginAction, resendAction, resetAction, signupAction } from "./actions";

export function LoginForm() {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-4">
      <FormMessage state={state} />
      <Field label={d.auth.email}><input className="input" type="email" name="email" autoComplete="email" required /></Field>
      <Field label={d.auth.password}><input className="input" type="password" name="password" autoComplete="current-password" required /></Field>
      <div className="text-right text-sm"><Link className="font-medium text-brand-700 hover:underline" href="/forgot-password">{d.auth.forgot}</Link></div>
      <SubmitButton className="btn-primary w-full" pendingText={d.common.loading}>{d.auth.login}</SubmitButton>
    </ActionForm>
  );
}

export function SignupForm() {
  const { d, lang } = useI18n();
  const [state, action, pending] = useActionState(signupAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-4">
      <FormMessage state={state} />
      <Field label={d.auth.fullName}><input className="input" name="full_name" autoComplete="name" required maxLength={120} /></Field>
      <Field label={d.auth.email}><input className="input" type="email" name="email" autoComplete="email" required /></Field>
      <Field label={d.auth.password} hint={d.auth.passwordHint}><input className="input" type="password" name="password" autoComplete="new-password" minLength={8} required /></Field>
      <Field label={d.common.language}>
        <select className="input" name="language" defaultValue={lang}>
          <option value="fr">{d.common.french}</option>
          <option value="en">{d.common.english}</option>
        </select>
      </Field>
      <label className="flex items-start gap-2 text-sm text-ink-700">
        <input type="checkbox" name="terms" className="mt-0.5 size-4 accent-brand-600" required />
        <span>{d.auth.acceptTerms}</span>
      </label>
      <SubmitButton className="btn-primary w-full" pendingText={d.common.loading}>{d.auth.signup}</SubmitButton>
    </ActionForm>
  );
}

export function ResendForm({ email }: { email: string }) {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(resendAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-3">
      <FormMessage state={state} />
      <input type="hidden" name="email" value={email} />
      <SubmitButton className="btn-secondary w-full" pendingText={d.common.loading}>{d.auth.resend}</SubmitButton>
    </ActionForm>
  );
}

export function ForgotForm() {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(forgotAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-4">
      <FormMessage state={state} />
      <Field label={d.auth.email}><input className="input" type="email" name="email" autoComplete="email" required /></Field>
      <SubmitButton className="btn-primary w-full" pendingText={d.common.loading}>{d.auth.sendLink}</SubmitButton>
    </ActionForm>
  );
}

export function ResetForm() {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(resetAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-4">
      <FormMessage state={state} />
      {state?.ok ? (
        <Link href="/app" className="btn-primary w-full">{d.nav.dashboard}</Link>
      ) : (
        <>
          <Field label={d.auth.newPassword} hint={d.auth.passwordHint}><input className="input" type="password" name="password" autoComplete="new-password" minLength={8} required /></Field>
          <Field label={d.auth.confirmPassword}><input className="input" type="password" name="confirm" autoComplete="new-password" minLength={8} required /></Field>
          <SubmitButton className="btn-primary w-full">{d.common.save}</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
