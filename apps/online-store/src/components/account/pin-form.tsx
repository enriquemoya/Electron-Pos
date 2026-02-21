"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, KeyboardEvent, SetStateAction } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type State = { ok: boolean; error?: string };

type PinFormProps = {
  action: (prev: State, formData: FormData) => Promise<State>;
  labels: {
    title: string;
    description: string;
    pin: string;
    confirmPin: string;
    submit: string;
    success: string;
    errorInvalid: string;
    errorServer: string;
  };
};

const initialState: State = { ok: false };

export function PinForm({ action, labels }: PinFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(action, initialState);
  const lastState = useRef<State>(initialState);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const errorMessage =
    state.error === "invalid"
      ? labels.errorInvalid
      : state.error === "server"
        ? labels.errorServer
        : null;

  const pinComplete = pin.length === 6;
  const confirmComplete = confirmPin.length === 6;
  const canSubmit = pinComplete && confirmComplete;

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setPin("");
      setConfirmPin("");
    }
  }, [state.ok]);

  useEffect(() => {
    if (state.ok && !lastState.current.ok) {
      toast.success(labels.success);
    }
    if (state.error && state.error !== lastState.current.error) {
      const title = state.error === "invalid" ? labels.errorInvalid : labels.errorServer;
      toast.error(title, { description: errorMessage || undefined });
    }
    lastState.current = state;
  }, [errorMessage, labels.errorInvalid, labels.errorServer, labels.success, state]);

  const parseDigits = (value: string) => value.replace(/\D/g, "").slice(0, 6);

  const handleOtpChange =
    (setter: Dispatch<SetStateAction<string>>) => (index: number, value: string) => {
      const digits = parseDigits(value);
      if (!digits) {
        setter((prev) => `${prev.slice(0, index)}${prev.slice(index + 1)}`);
        return;
      }
      setter((prev) => {
        const chars = prev.padEnd(6, " ").split("");
        for (let i = 0; i < digits.length && index + i < 6; i += 1) {
          chars[index + i] = digits[i];
        }
        return chars.join("").replace(/\s/g, "").slice(0, 6);
      });
    };

  const handleKeyDown = (
    value: string,
    setter: Dispatch<SetStateAction<string>>,
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
      if (event.key === "Backspace" && !value[index]) {
        const prevIndex = Math.max(index - 1, 0);
        const prevInput = event.currentTarget.form?.elements.namedItem(`otp-${event.currentTarget.dataset.group}-${prevIndex}`) as
          | HTMLInputElement
          | null;
        prevInput?.focus();
      }
      if (event.key === "ArrowLeft") {
        const prevIndex = Math.max(index - 1, 0);
        const prevInput = event.currentTarget.form?.elements.namedItem(`otp-${event.currentTarget.dataset.group}-${prevIndex}`) as
          | HTMLInputElement
          | null;
        prevInput?.focus();
      }
      if (event.key === "ArrowRight") {
        const nextIndex = Math.min(index + 1, 5);
        const nextInput = event.currentTarget.form?.elements.namedItem(`otp-${event.currentTarget.dataset.group}-${nextIndex}`) as
          | HTMLInputElement
          | null;
        nextInput?.focus();
      }
      if (event.key.length === 1 && /\D/.test(event.key)) {
        event.preventDefault();
      }
      if (event.key === "Backspace") {
        setter(`${value.slice(0, index)}${value.slice(index + 1)}`);
      }
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-6" noValidate>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">{labels.title}</h2>
        <p className="text-sm text-white/60">{labels.description}</p>
      </div>
      <input type="hidden" name="pin" value={pin} />
      <input type="hidden" name="confirmPin" value={confirmPin} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-white/70">
          <span>{labels.pin}</span>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <input
                key={`pin-${index}`}
                name={`otp-pin-${index}`}
                data-group="pin"
                className="h-11 w-full rounded-md border border-white/15 bg-white/[0.04] text-center text-base text-white outline-none ring-offset-transparent transition focus:border-white/35 focus:ring-2 focus:ring-white/20"
                inputMode="numeric"
                autoComplete="off"
                maxLength={1}
                value={pin[index] ?? ""}
                onChange={(event) => {
                  const next = parseDigits(event.target.value);
                  handleOtpChange(setPin)(index, next);
                  if (next && index < 5) {
                    const nextInput = event.currentTarget.form?.elements.namedItem(`otp-pin-${index + 1}`) as HTMLInputElement | null;
                    nextInput?.focus();
                  }
                }}
                onKeyDown={(event) => handleKeyDown(pin, setPin, index, event)}
              />
            ))}
          </div>
        </label>
        <label className="space-y-2 text-sm text-white/70">
          <span>{labels.confirmPin}</span>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <input
                key={`confirm-pin-${index}`}
                name={`otp-confirm-${index}`}
                data-group="confirm"
                className="h-11 w-full rounded-md border border-white/15 bg-white/[0.04] text-center text-base text-white outline-none ring-offset-transparent transition focus:border-white/35 focus:ring-2 focus:ring-white/20"
                inputMode="numeric"
                autoComplete="off"
                maxLength={1}
                value={confirmPin[index] ?? ""}
                onChange={(event) => {
                  const next = parseDigits(event.target.value);
                  handleOtpChange(setConfirmPin)(index, next);
                  if (next && index < 5) {
                    const nextInput = event.currentTarget.form?.elements.namedItem(`otp-confirm-${index + 1}`) as
                      | HTMLInputElement
                      | null;
                    nextInput?.focus();
                  }
                }}
                onKeyDown={(event) => handleKeyDown(confirmPin, setConfirmPin, index, event)}
              />
            ))}
          </div>
        </label>
      </div>

      {state.ok ? <p className="text-sm text-green-300">{labels.success}</p> : null}
      {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}

      <Button type="submit" disabled={!canSubmit}>
        {labels.submit}
      </Button>
    </form>
  );
}
