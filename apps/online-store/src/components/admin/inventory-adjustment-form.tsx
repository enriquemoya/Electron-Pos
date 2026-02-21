"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InventoryAdjustmentFormProps = {
  action: (formData: FormData) => void;
  locale: string;
  productId: string;
  scopeType: "ONLINE_STORE" | "BRANCH";
  branchId: string | null;
  returnTo?: string;
  allowDecrement: boolean;
  labels: {
    reason: string;
    apply: string;
  };
};

export function InventoryAdjustmentForm({
  action,
  locale,
  productId,
  scopeType,
  branchId,
  returnTo,
  allowDecrement,
  labels
}: InventoryAdjustmentFormProps) {
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState("");

  const canSubmit = useMemo(() => {
    if (delta === 0) {
      return false;
    }
    if (delta < 0 && !allowDecrement) {
      return false;
    }
    if (delta < 0 && reason.trim().length === 0) {
      return false;
    }
    return true;
  }, [allowDecrement, delta, reason]);
  const normalizedReason = useMemo(() => {
    const trimmed = reason.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
    if (delta > 0) {
      return "manual_increment";
    }
    return "";
  }, [delta, reason]);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="scopeType" value={scopeType} />
      <input type="hidden" name="branchId" value={branchId ?? ""} />
      <input type="hidden" name="returnTo" value={returnTo ?? ""} />
      <input type="hidden" name="delta" value={String(delta)} />
      <input type="hidden" name="reason" value={normalizedReason} />

      <div className="flex items-center overflow-hidden rounded-lg border border-white/10 bg-base-900">
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-10 rounded-none border-r border-white/10 px-0 text-lg text-white hover:bg-white/10 disabled:text-white/30"
          disabled={!allowDecrement}
          onClick={() => setDelta((current) => current - 1)}
        >
          -
        </Button>
        <Input
          type="number"
          inputMode="numeric"
          value={delta}
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10);
            if (Number.isNaN(next)) {
              setDelta(0);
              return;
            }
            setDelta(next);
          }}
          className="h-9 rounded-none border-none bg-transparent text-center font-semibold text-white focus-visible:ring-0"
        />
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-10 rounded-none border-l border-white/10 px-0 text-lg text-white hover:bg-white/10"
          onClick={() => setDelta((current) => current + 1)}
        >
          +
        </Button>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`inventory-reason-${productId}`} className="text-[10px] text-white/50">
          {labels.reason}
        </Label>
        <Input
          id={`inventory-reason-${productId}`}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="h-8 border-white/10 bg-base-900 text-white"
          disabled={delta === 0}
        />
      </div>

      <Button type="submit" size="sm" className="h-9 w-full bg-accent-500 text-base-950 hover:bg-accent-500/90" disabled={!canSubmit}>
        {labels.apply}
      </Button>
    </form>
  );
}
