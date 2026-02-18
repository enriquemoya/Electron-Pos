"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type OrderTotalPopoverProps = {
  currency: string;
  subtotal: number;
  refundsTotal: number;
  finalTotal: number;
  items: Array<{ id: string; label: string; quantity: number; amount: number }>;
  refunds: Array<{ orderItemId: string | null; label: string; state: "FULL" | "PARTIAL"; amount: number }>;
  labels: {
    subtotal: string;
    refunds: string;
    finalTotal: string;
    qty: string;
    full: string;
    fullTag: string;
    partialTag: string;
  };
};

export function OrderTotalPopover({
  currency,
  subtotal,
  refundsTotal,
  finalTotal,
  items,
  refunds,
  labels
}: OrderTotalPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="text-left text-sm text-amber-300 hover:text-amber-200">
          {currency} {finalTotal.toFixed(2)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96 space-y-3 p-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-white/60">{labels.subtotal}</p>
          <div className="space-y-1">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 text-sm">
                <p className="text-white/80">
                  {item.label} <span className="text-white/50">{labels.qty}: {item.quantity}</span>
                </p>
                <p className="text-right text-white/80">
                  {currency} {item.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 border-t border-white/10 pt-3">
          <p className="text-xs uppercase tracking-wide text-white/60">{labels.refunds}</p>
          {refunds.length ? (
            <div className="space-y-1">
              {refunds.map((refund, index) => (
                <div key={`${refund.orderItemId ?? "full"}-${index}`} className="grid grid-cols-[1fr_auto] gap-3 text-sm">
                  <p className="text-white/70">
                    {refund.label || (refund.orderItemId ? refund.orderItemId : labels.full)}{" "}
                    <span className="text-white/50">({refund.state === "FULL" ? labels.fullTag : labels.partialTag})</span>
                  </p>
                  <p className="text-right text-rose-300">- {currency} {refund.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/50">{currency} 0.00</p>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto] border-t border-white/10 pt-3 text-sm font-semibold text-white">
          <p>{labels.finalTotal}</p>
          <p>
            {currency} {finalTotal.toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-[1fr_auto] text-xs text-white/60">
          <p>{labels.subtotal}</p>
          <p>
            {currency} {subtotal.toFixed(2)}
          </p>
        </div>
        <div className="grid grid-cols-[1fr_auto] text-xs text-white/60">
          <p>{labels.refunds}</p>
          <p>
            - {currency} {refundsTotal.toFixed(2)}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
