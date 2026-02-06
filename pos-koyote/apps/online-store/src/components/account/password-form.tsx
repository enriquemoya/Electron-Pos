"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type State = { ok: boolean; error?: string };

type PasswordFormProps = {
  action: (prev: State, formData: FormData) => Promise<State>;
  labels: {
    title: string;
    description: string;
    password: string;
    confirmPassword: string;
    submit: string;
    success: string;
    errorInvalid: string;
    errorServer: string;
  };
};

const initialState: State = { ok: false };

export function PasswordForm({ action, labels }: PasswordFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(action, initialState);
  const errorMessage =
    state.error === "invalid"
      ? labels.errorInvalid
      : state.error === "server"
        ? labels.errorServer
        : null;

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">{labels.title}</h2>
        <p className="text-sm text-white/60">{labels.description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-white/70">
          <span>{labels.password}</span>
          <Input name="password" type="password" autoComplete="new-password" required />
        </label>
        <label className="space-y-2 text-sm text-white/70">
          <span>{labels.confirmPassword}</span>
          <Input name="confirmPassword" type="password" autoComplete="new-password" required />
        </label>
      </div>

      {state.ok ? <p className="text-sm text-green-300">{labels.success}</p> : null}
      {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}

      <Button type="submit">{labels.submit}</Button>
    </form>
  );
}
