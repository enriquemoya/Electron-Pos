"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type Role = "CUSTOMER" | "ADMIN";
type Status = "ACTIVE" | "DISABLED";

type Labels = {
  roleLabel: string;
  statusLabel: string;
  roleCustomer: string;
  roleAdmin: string;
  statusActive: string;
  statusDisabled: string;
  updateAction: string;
  confirmTitle: string;
  confirmBody: string;
  confirmPrimary: string;
  confirmCancel: string;
  errorGeneric: string;
};

type UpdateAction = (payload: { role: Role; status: Status }) => Promise<{ ok: boolean; error?: string }>;

type Props = {
  initialRole: Role;
  initialStatus: Status;
  labels: Labels;
  onUpdate: UpdateAction;
};

export function UserRoleStatusForm({ initialRole, initialStatus, labels, onUpdate }: Props) {
  const [role, setRole] = useState<Role>(initialRole);
  const [status, setStatus] = useState<Status>(initialStatus);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasChanges = role !== initialRole || status !== initialStatus;

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await onUpdate({ role, status });
      if (!result.ok) {
        setError(result.error || labels.errorGeneric);
      } else {
        setOpen(false);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-white/70">
          <span>{labels.roleLabel}</span>
          <select
            className="w-full rounded-md border border-white/10 bg-base-900 px-3 py-2 text-white"
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
          >
            <option value="CUSTOMER">{labels.roleCustomer}</option>
            <option value="ADMIN">{labels.roleAdmin}</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-white/70">
          <span>{labels.statusLabel}</span>
          <select
            className="w-full rounded-md border border-white/10 bg-base-900 px-3 py-2 text-white"
            value={status}
            onChange={(event) => setStatus(event.target.value as Status)}
          >
            <option value="ACTIVE">{labels.statusActive}</option>
            <option value="DISABLED">{labels.statusDisabled}</option>
          </select>
        </label>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="flex items-center gap-3">
        <Button type="button" onClick={() => setOpen(true)} disabled={!hasChanges || isPending}>
          {labels.updateAction}
        </Button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-base-900 p-5">
            <h3 className="text-lg font-semibold text-white">{labels.confirmTitle}</h3>
            <p className="mt-2 text-sm text-white/70">{labels.confirmBody}</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
                {labels.confirmCancel}
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={isPending}>
                {labels.confirmPrimary}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
