"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type StatusOption = {
  value: string;
  label: string;
};

type OrderStatusTransitionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  locale: string;
  orderId: string;
  defaultStatus: string;
  statusOptions: StatusOption[];
  labels: {
    title: string;
    reason: string;
    submit: string;
    confirmTitle: string;
    confirmBody: string;
    confirmAction: string;
    cancelAction: string;
  };
};

export function OrderStatusTransitionForm({
  action,
  locale,
  orderId,
  defaultStatus,
  statusOptions,
  labels
}: OrderStatusTransitionFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toStatus, setToStatus] = useState(defaultStatus);
  const [reason, setReason] = useState("");

  const onConfirm = () => {
    setConfirmOpen(false);
    formRef.current?.requestSubmit();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-semibold text-white">{labels.title}</h2>
      <form ref={formRef} action={action} className="mt-4 grid gap-3 md:grid-cols-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="orderId" value={orderId} />
        <select
          name="toStatus"
          value={toStatus}
          onChange={(event) => setToStatus(event.target.value)}
          className="h-10 rounded-md border border-white/10 bg-base-800 px-3 text-sm text-white"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Input
          type="text"
          name="reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={labels.reason}
          className="md:col-span-2"
        />
        <Button
          type="button"
          className="h-10 rounded-md bg-amber-400 px-4 text-sm font-semibold text-black transition hover:bg-amber-300"
          onClick={() => setConfirmOpen(true)}
        >
          {labels.submit}
        </Button>
      </form>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{labels.confirmTitle}</DialogTitle>
            <DialogDescription>{labels.confirmBody}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              {labels.cancelAction}
            </Button>
            <Button type="button" onClick={onConfirm}>
              {labels.confirmAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
