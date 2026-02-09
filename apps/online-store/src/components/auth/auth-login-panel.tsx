"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/login-form";
import { PasswordLoginForm } from "@/components/auth/password-login-form";

type State = { ok: boolean; error?: string };

type AuthLoginPanelProps = {
  locale: string;
  initialError?: "invalid" | "server";
  magicLinkAction: (prev: State, formData: FormData) => Promise<State>;
  passwordAction: (prev: State, formData: FormData) => Promise<State>;
  labels: {
    magic: {
      emailLabel: string;
      emailPlaceholder: string;
      submit: string;
      success: string;
      errorInvalid: string;
      errorServer: string;
    };
    password: {
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      submit: string;
      errorInvalid: string;
      errorServer: string;
    };
    toggleToPassword: string;
    toggleToMagic: string;
    passwordHint: string;
  };
};

export function AuthLoginPanel({
  locale,
  initialError,
  magicLinkAction,
  passwordAction,
  labels
}: AuthLoginPanelProps) {
  const [mode, setMode] = useState<"magic" | "password">("magic");

  return (
    <div className="space-y-6">
      {mode === "magic" ? (
        <div className="space-y-4">
          <LoginForm
            locale={locale}
            initialError={initialError}
            action={magicLinkAction}
            labels={labels.magic}
          />
          <div className="space-y-2">
            <p className="text-sm text-white/60">{labels.passwordHint}</p>
            <Button type="button" variant="outline" onClick={() => setMode("password")}>
              {labels.toggleToPassword}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <PasswordLoginForm
            locale={locale}
            action={passwordAction}
            labels={labels.password}
          />
          <Button type="button" variant="ghost" onClick={() => setMode("magic")}>
            {labels.toggleToMagic}
          </Button>
        </div>
      )}
    </div>
  );
}
