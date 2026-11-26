"use client";
import { useActionState } from "react";
import { useI18n } from "@/i18n/client";
import { ActionForm, FormMessage, SubmitButton } from "@/components/forms";
import { runCoachAction, runForecastAction } from "./actions";

export function ForecastRunForm({ horizon }: { horizon: number }) {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(runForecastAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-2">
      <input type="hidden" name="horizon" value={horizon} />
      <FormMessage state={state} />
      <SubmitButton pendingText={d.forecast.generating}>{d.forecast.generate}</SubmitButton>
    </ActionForm>
  );
}

export function CoachRunForm() {
  const { d } = useI18n();
  const [state, action, pending] = useActionState(runCoachAction, undefined);
  return (
    <ActionForm action={action} pending={pending} className="space-y-2">
      <FormMessage state={state} />
      <SubmitButton pendingText={d.coach.running}>{d.coach.run}</SubmitButton>
    </ActionForm>
  );
}
