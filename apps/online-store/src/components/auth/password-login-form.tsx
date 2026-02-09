"use client";

import { useFormState } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type State = { ok: boolean; error?: string };

type Props = {
  action: (prev: State, formData: FormData) => Promise<State>;
  locale: string;
  labels: {
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submit: string;
    errorInvalid: string;
    errorServer: string;
  };
};

const initialState: State = { ok: false };

export function PasswordLoginForm({ action, labels, locale }: Props) {
  const [state, formAction] = useFormState(action, initialState);
  const errorMessage =
    state.error === "invalid" || state.error === "missing"
      ? labels.errorInvalid
      : state.error
        ? labels.errorServer
        : null;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <label className="space-y-2 text-sm text-white/70">
        <span>{labels.emailLabel}</span>
        <Input name="email" type="email" placeholder={labels.emailPlaceholder} required />
      </label>
      <label className="space-y-2 text-sm text-white/70">
        <span>{labels.passwordLabel}</span>
        <Input name="password" type="password" placeholder={labels.passwordPlaceholder} required />
      </label>
      {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}
      <Button type="submit">{labels.submit}</Button>
    </form>
  );
}
