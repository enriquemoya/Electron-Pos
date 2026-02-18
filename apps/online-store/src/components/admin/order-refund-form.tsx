"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RefundMethod = "CASH" | "CARD" | "STORE_CREDIT" | "TRANSFER" | "OTHER";

type OrderRefundFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  locale: string;
  orderId: string;
  maxAmount: number;
  items: Array<{ id: string; label: string; maxRefundable: number }>;
  labels: {
    trigger: string;
    title: string;
    subtitle: string;
    itemLabel: string;
    fullOrder: string;
    amountLabel: string;
    amountHelp: string;
    methodLabel: string;
    messageLabel: string;
    messagePlaceholder: string;
    submit: string;
    cancel: string;
    methods: Record<RefundMethod, string>;
  };
};

export function OrderRefundForm({ action, locale, orderId, maxAmount, items, labels }: OrderRefundFormProps) {
  const [open, setOpen] = useState(false);
  const [orderItemId, setOrderItemId] = useState<string>("FULL_ORDER");
  const [amount, setAmount] = useState<string>("");
  const [refundMethod, setRefundMethod] = useState<RefundMethod>("TRANSFER");
  const [adminMessage, setAdminMessage] = useState<string>("");

  const selected = items.find((item) => item.id === orderItemId);
  const selectedMax = selected ? selected.maxRefundable : maxAmount;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="bg-amber-400 text-black hover:bg-amber-300">
          {labels.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.subtitle}</DialogDescription>
        </DialogHeader>

        <form
          action={action}
          className="space-y-4"
          onSubmit={() => {
            setOpen(false);
          }}
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="orderItemId" value={orderItemId === "FULL_ORDER" ? "" : orderItemId} />
          <input type="hidden" name="refundMethod" value={refundMethod} />

          <div className="space-y-2">
            <p className="text-sm text-white/80">{labels.itemLabel}</p>
            <Select value={orderItemId} onValueChange={setOrderItemId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_ORDER">{labels.fullOrder}</SelectItem>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/80" htmlFor="refund-amount">
              {labels.amountLabel}
            </label>
            <Input
              id="refund-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={selectedMax}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
            <p className="text-xs text-white/60">
              {labels.amountHelp} {selectedMax.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-white/80">{labels.methodLabel}</p>
            <Select value={refundMethod} onValueChange={(value) => setRefundMethod(value as RefundMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">{labels.methods.CASH}</SelectItem>
                <SelectItem value="CARD">{labels.methods.CARD}</SelectItem>
                <SelectItem value="STORE_CREDIT">{labels.methods.STORE_CREDIT}</SelectItem>
                <SelectItem value="TRANSFER">{labels.methods.TRANSFER}</SelectItem>
                <SelectItem value="OTHER">{labels.methods.OTHER}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/80" htmlFor="refund-admin-message">
              {labels.messageLabel}
            </label>
            <textarea
              id="refund-admin-message"
              name="adminMessage"
              value={adminMessage}
              onChange={(event) => setAdminMessage(event.target.value)}
              placeholder={labels.messagePlaceholder}
              className="min-h-24 w-full rounded-md border border-white/10 bg-base-800 px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-amber-400"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {labels.cancel}
            </Button>
            <Button type="submit" className="bg-amber-400 text-black hover:bg-amber-300">
              {labels.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
