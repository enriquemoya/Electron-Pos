"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type OrderTotalPopoverProps = {
  currency: string;
  subtotalCents: number;
  refundsCents: number;
  totalCents: number;
  breakdown?: {
    items: Array<{ productName: string; qty: number; lineTotalCents: number }>;
    refunds: Array<{ productName: string; amountCents: number; type: "FULL" | "PARTIAL"; method: string }>;
  };
  labels: {
    subtotal: string;
    refunds: string;
    total: string;
    quantityShort: string;
    full: string;
    partial: string;
    totalsPending: string;
    methods: Record<string, string>;
  };
};

function formatFromCents(cents: number) {
  return (cents / 100).toFixed(2);
}

export function OrderTotalPopover({ currency, subtotalCents, refundsCents, totalCents, breakdown, labels }: OrderTotalPopoverProps) {
  if (!breakdown) {
    return (
      <div className="text-right">
        <p className="text-sm text-white">{currency} {formatFromCents(totalCents)}</p>
        <p className="text-xs text-white/50">{labels.totalsPending}</p>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="text-left text-sm text-amber-300 hover:text-amber-200">
          {currency} {formatFromCents(totalCents)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[26rem] space-y-3 p-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-white/60">{labels.subtotal}</p>
          <div className="space-y-1">
            {breakdown.items.map((item, index) => (
              <div key={`${item.productName}-${index}`} className="grid grid-cols-[1fr_auto] gap-3 text-sm">
                <p className="text-white/80">
                  {item.productName} <span className="text-white/50">{labels.quantityShort}: {item.qty}</span>
                </p>
                <p className="text-right text-white/80">{currency} {formatFromCents(item.lineTotalCents)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 border-t border-white/10 pt-3">
          <p className="text-xs uppercase tracking-wide text-white/60">{labels.refunds}</p>
          {breakdown.refunds.length ? (
            <div className="space-y-1">
              {breakdown.refunds.map((refund, index) => (
                <div key={`${refund.productName}-${refund.method}-${index}`} className="grid grid-cols-[1fr_auto] gap-3 text-sm">
                  <p className="text-white/70">
                    {refund.productName === "FULL_ORDER" ? labels.total : refund.productName}{" "}
                    <span className="text-white/50">
                      ({refund.type === "FULL" ? labels.full : labels.partial} / {labels.methods[refund.method] || refund.method})
                    </span>
                  </p>
                  <p className="text-right text-rose-300">- {currency} {formatFromCents(refund.amountCents)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/50">{currency} 0.00</p>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto] border-t border-white/10 pt-3 text-sm font-semibold text-white">
          <p>{labels.total}</p>
          <p>{currency} {formatFromCents(totalCents)}</p>
        </div>

        <div className="grid grid-cols-[1fr_auto] text-xs text-white/60">
          <p>{labels.subtotal}</p>
          <p>{currency} {formatFromCents(subtotalCents)}</p>
        </div>
        <div className="grid grid-cols-[1fr_auto] text-xs text-white/60">
          <p>{labels.refunds}</p>
          <p>- {currency} {formatFromCents(refundsCents)}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
