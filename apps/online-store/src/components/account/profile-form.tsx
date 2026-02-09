"use client";

import { useFormState } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type State = { ok: boolean; error?: string };

type ProfileFormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  address: {
    street: string;
    externalNumber: string;
    internalNumber: string;
    postalCode: string;
    neighborhood: string;
    city: string;
    state: string;
    country: string;
    references: string;
  };
};

type ProfileFormProps = {
  action: (prev: State, formData: FormData) => Promise<State>;
  values: ProfileFormValues;
  labels: {
    title: string;
    description: string;
    firstName: string;
    lastName: string;
    phone: string;
    addressTitle: string;
    street: string;
    externalNumber: string;
    internalNumber: string;
    postalCode: string;
    neighborhood: string;
    city: string;
    state: string;
    country: string;
    references: string;
    submit: string;
    success: string;
    errorInvalid: string;
    errorServer: string;
  };
};

const initialState: State = { ok: false };

export function ProfileForm({ action, labels, values }: ProfileFormProps) {
  const [state, formAction] = useFormState(action, initialState);
  const errorMessage =
    state.error === "invalid"
      ? labels.errorInvalid
      : state.error === "server"
        ? labels.errorServer
        : null;

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">{labels.title}</h2>
        <p className="text-sm text-white/60">{labels.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-white/70">
          <span>{labels.firstName}</span>
          <Input name="firstName" defaultValue={values.firstName} required />
        </label>
        <label className="space-y-2 text-sm text-white/70">
          <span>{labels.lastName}</span>
          <Input name="lastName" defaultValue={values.lastName} required />
        </label>
        <label className="space-y-2 text-sm text-white/70 sm:col-span-2">
          <span>{labels.phone}</span>
          <Input name="phone" defaultValue={values.phone} />
        </label>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">
          {labels.addressTitle}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-white/70 sm:col-span-2">
            <span>{labels.street}</span>
            <Input name="street" defaultValue={values.address.street} />
          </label>
          <label className="space-y-2 text-sm text-white/70">
            <span>{labels.externalNumber}</span>
            <Input name="externalNumber" defaultValue={values.address.externalNumber} />
          </label>
          <label className="space-y-2 text-sm text-white/70">
            <span>{labels.internalNumber}</span>
            <Input name="internalNumber" defaultValue={values.address.internalNumber} />
          </label>
          <label className="space-y-2 text-sm text-white/70">
            <span>{labels.postalCode}</span>
            <Input name="postalCode" defaultValue={values.address.postalCode} />
          </label>
          <label className="space-y-2 text-sm text-white/70">
            <span>{labels.neighborhood}</span>
            <Input name="neighborhood" defaultValue={values.address.neighborhood} />
          </label>
          <label className="space-y-2 text-sm text-white/70">
            <span>{labels.city}</span>
            <Input name="city" defaultValue={values.address.city} />
          </label>
          <label className="space-y-2 text-sm text-white/70">
            <span>{labels.state}</span>
            <Input name="state" defaultValue={values.address.state} />
          </label>
          <label className="space-y-2 text-sm text-white/70">
            <span>{labels.country}</span>
            <Input name="country" defaultValue={values.address.country} />
          </label>
          <label className="space-y-2 text-sm text-white/70 sm:col-span-2">
            <span>{labels.references}</span>
            <Input name="references" defaultValue={values.address.references} />
          </label>
        </div>
      </div>

      {state.ok ? <p className="text-sm text-green-300">{labels.success}</p> : null}
      {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}

      <Button type="submit">{labels.submit}</Button>
    </form>
  );
}
