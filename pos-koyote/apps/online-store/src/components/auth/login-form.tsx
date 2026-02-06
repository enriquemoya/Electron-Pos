"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type State = { ok: boolean; error?: string };

type Props = {
  action: (prev: State, formData: FormData) => Promise<State>;
  locale: string;
  initialError?: "invalid" | "server";
  labels: {
    emailLabel: string;
    emailPlaceholder: string;
    submit: string;
    success: string;
    errorInvalid: string;
    errorServer: string;
  };
};

const initialState: State = { ok: false };

export function LoginForm({ action, labels, locale, initialError }: Props) {
  const [state, formAction] = useFormState(action, initialState);
  const errorKey = state.error ?? initialError ?? null;
  const errorMessage =
    errorKey === "invalid" || errorKey === "missing" ? labels.errorInvalid : errorKey ? labels.errorServer : null;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <label className="space-y-2 text-sm text-white/70">
        <span>{labels.emailLabel}</span>
        <Input name="email" type="email" placeholder={labels.emailPlaceholder} required />
      </label>
      {state.ok ? <p className="text-sm text-green-300">{labels.success}</p> : null}
      {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}
      <Button type="submit">{labels.submit}</Button>
    </form>
  );
}
