"use client";
import { useActionState, useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n";
import { ActionForm, Field, FormMessage, SubmitButton } from "@/components/forms";
import { createInviteAction } from "./actions";

export function InviteForm({ rolesEnabled, businessName }: { rolesEnabled: boolean; businessName: string }) {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(createInviteAction, undefined);
  const [copied, setCopied] = useState(false);
  const link = state?.link;
  return (
    <div className="space-y-4">
      <ActionForm action={action} pending={pending} className="space-y-4">
        <FormMessage state={state?.error ? { error: state.error } : undefined} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={d.team.inviteEmail}><input className="input" type="email" name="email" required autoComplete="off" /></Field>
          <Field label={d.team.inviteRole}>
            <select className="input" name="role" defaultValue={rolesEnabled ? "staff" : "manager"}>
              <option value="manager">{d.roles.manager}</option>
              {rolesEnabled && <option value="staff">{d.roles.staff}</option>}
            </select>
          </Field>
        </div>
        <p className="text-xs text-ink-500">{d.team.inviteHelp}</p>
        <SubmitButton pendingText={d.common.loading}>{d.team.inviteButton}</SubmitButton>
      </ActionForm>
      {link && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4" data-testid="invite-link">
          <p className="mb-2 text-sm font-semibold text-brand-800">{d.team.linkReady}</p>
          <input className="input mb-3 font-mono text-xs" value={link} readOnly onFocus={(e) => e.currentTarget.select()} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={async () => {
                try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* copie manuelle possible */ }
              }}
            >
              {copied ? d.team.copied : d.team.copy}
            </button>
            <a
              className="btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(fmt(d.team.whatsappText, { business: businessName, link }))}`}
            >
              {d.team.shareWhatsapp}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export function ConfirmSubmit({ label, message, className = "btn-secondary" }: { label: string; message: string; className?: string }) {
  return (
    <button type="submit" className={className} onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>
      {label}
    </button>
  );
}
