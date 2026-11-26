"use client";
import { useActionState } from "react";
import { useI18n } from "@/i18n/client";
import { ActionForm, FormMessage, SubmitButton } from "@/components/forms";
import { acceptInviteAction } from "./actions";

export function AcceptForm({ token }: { token: string }) {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(acceptInviteAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <SubmitButton className="btn-primary w-full" pendingText={d.common.loading}>{d.invite.accept}</SubmitButton>
    </ActionForm>
  );
}
