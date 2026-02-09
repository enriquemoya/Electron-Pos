"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CreateBranchState = { error?: string | null };

type BranchCreateLabels = {
  name: string;
  city: string;
  address: string;
  imageUrl: string;
  latitude: string;
  longitude: string;
  submit: string;
  error: string;
  errorDetails: string;
};

type BranchCreateFormProps = {
  locale: string;
  action: (prevState: CreateBranchState, formData: FormData) => Promise<CreateBranchState>;
  labels: BranchCreateLabels;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" className="w-fit" disabled={pending}>
      {label}
    </Button>
  );
}

export function BranchCreateForm({ locale, action, labels }: BranchCreateFormProps) {
  const [state, formAction] = useFormState<CreateBranchState, FormData>(action, { error: null });

  return (
    <form action={formAction} className="grid gap-3 rounded-2xl border border-white/10 p-4">
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-3 md:grid-cols-2">
        <Input name="name" placeholder={labels.name} required />
        <Input name="city" placeholder={labels.city} required />
        <Input name="address" placeholder={labels.address} required />
        <Input name="imageUrl" placeholder={labels.imageUrl} />
        <Input name="latitude" type="text" placeholder={labels.latitude} required />
        <Input name="longitude" type="text" placeholder={labels.longitude} required />
      </div>
      {state?.error ? (
        <div className="space-y-1 text-xs text-rose-200">
          <p>{labels.error}</p>
          <p>{labels.errorDetails.replace("{detail}", state.error)}</p>
        </div>
      ) : null}
      <SubmitButton label={labels.submit} />
    </form>
  );
}
