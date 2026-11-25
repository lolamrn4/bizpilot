"use client";
import { createContext, startTransition, useContext } from "react";
import { useFormStatus } from "react-dom";
import { useI18n } from "@/i18n/client";

export type ActionState = { error?: string; ok?: string } | undefined;

const PendingCtx = createContext(false);

/**
 * Formulaire relié à une Server Action sans réinitialisation automatique :
 * en cas d'erreur, l'utilisateur garde ce qu'il a saisi.
 */
export function ActionForm({ action, pending, className, children }: { action: (fd: FormData) => void; pending: boolean; className?: string; children: React.ReactNode }) {
  return (
    <PendingCtx.Provider value={pending}>
      <form
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => action(fd));
        }}
      >
        {children}
      </form>
    </PendingCtx.Provider>
  );
}

export function SubmitButton({ children, className = "btn-primary", pendingText }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const ctxPending = useContext(PendingCtx);
  const { pending: statusPending } = useFormStatus();
  const pending = ctxPending || statusPending;
  const { d } = useI18n();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingText ?? d.common.saving : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state) return null;
  if (state.error) return <p role="alert" className="alert-error">{state.error}</p>;
  if (state.ok) return <p role="status" className="alert-ok">{state.ok}</p>;
  return null;
}

export function Field({ label, hint, children, optional }: { label: string; hint?: string; children: React.ReactNode; optional?: boolean }) {
  const { d } = useI18n();
  return (
    <label className="block">
      <span className="label">
        {label}
        {optional && <span className="ml-1 font-normal text-ink-400">({d.common.optional})</span>}
      </span>
      {children}
      {hint && <span className="hint block">{hint}</span>}
    </label>
  );
}

export function ConfirmButton({ children, className = "btn-danger" }: { children: React.ReactNode; className?: string }) {
  const { d } = useI18n();
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(d.common.confirmDelete)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

export function LockNote({ text }: { text: string }) {
  return (
    <p className="alert-info flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
      {text}
    </p>
  );
}
