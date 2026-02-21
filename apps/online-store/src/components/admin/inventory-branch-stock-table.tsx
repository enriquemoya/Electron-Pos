"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

type ScopeType = "ONLINE_STORE" | "BRANCH";

type BranchRow = {
  branchId: string;
  branchName: string;
  branchCity: string | null;
  available: number;
  reserved: number;
  total: number;
  scopeType: ScopeType;
};

type Adjustment = {
  delta: string;
  reason: string;
};

type PendingMovement = {
  key: string;
  productId: string;
  scopeType: ScopeType;
  branchId: string | null;
  delta: number;
  reason: string;
};

type Props = {
  productId: string;
  rows: BranchRow[];
  labels: {
    branch: string;
    available: string;
    reserved: string;
    total: string;
    state: string;
    adjust: string;
    reason: string;
    apply: string;
    bulkAdjust: string;
    soldOutState: string;
    lowStockState: string;
    availableState: string;
    digitalScope: string;
    confirmTitle: string;
    confirmDescription: string;
    confirmContinue: string;
    confirmCancel: string;
    invalidToast: string;
  };
};

function getStockState(total: number): "AVAILABLE" | "LOW_STOCK" | "SOLD_OUT" {
  if (total <= 0) {
    return "SOLD_OUT";
  }
  if (total < 5) {
    return "LOW_STOCK";
  }
  return "AVAILABLE";
}

export function InventoryBranchStockTable({ productId, rows, labels }: Props) {
  const router = useRouter();
  const [adjustments, setAdjustments] = useState<Record<string, Adjustment>>({});
  const [invalidRows, setInvalidRows] = useState<Set<string>>(new Set());
  const [pendingMovements, setPendingMovements] = useState<PendingMovement[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const stateLabel = (state: "AVAILABLE" | "LOW_STOCK" | "SOLD_OUT") => {
    if (state === "SOLD_OUT") {
      return labels.soldOutState;
    }
    if (state === "LOW_STOCK") {
      return labels.lowStockState;
    }
    return labels.availableState;
  };

  const setAdjustment = (key: string, next: Partial<Adjustment>) => {
    setAdjustments((current) => ({
      ...current,
      [key]: {
        delta: current[key]?.delta ?? "",
        reason: current[key]?.reason ?? "",
        ...next
      }
    }));
  };

  const validate = (key: string) => {
    const value = adjustments[key] ?? { delta: "", reason: "" };
    const deltaFilled = value.delta.trim().length > 0;
    const reasonFilled = value.reason.trim().length > 0;
    if (!deltaFilled && !reasonFilled) {
      return { status: "empty" as const };
    }
    if (deltaFilled !== reasonFilled) {
      return { status: "invalid" as const };
    }
    const delta = Number.parseInt(value.delta, 10);
    if (!Number.isInteger(delta) || delta === 0) {
      return { status: "invalid" as const };
    }
    return { status: "valid" as const, delta, reason: value.reason.trim() };
  };

  const buildMovements = (keys: string[]) => {
    const invalid = new Set<string>();
    const valid: PendingMovement[] = [];
    for (const key of keys) {
      const check = validate(key);
      if (check.status === "empty") {
        continue;
      }
      if (check.status === "invalid") {
        invalid.add(key);
        continue;
      }
      const row = rows.find((entry) => `${entry.scopeType}:${entry.branchId}` === key);
      if (!row) {
        continue;
      }
      valid.push({
        key,
        productId,
        scopeType: row.scopeType,
        branchId: row.scopeType === "BRANCH" ? row.branchId : null,
        delta: check.delta,
        reason: check.reason
      });
    }
    return { invalid, valid };
  };

  const openConfirmation = (movements: PendingMovement[]) => {
    setPendingMovements(movements);
    setConfirmOpen(true);
  };

  const handleSingle = (key: string) => {
    const { invalid, valid } = buildMovements([key]);
    if (invalid.size > 0) {
      setInvalidRows(new Set([...invalidRows, ...invalid]));
      toast.error(labels.invalidToast);
      return;
    }
    if (valid.length === 0) {
      toast.error(labels.invalidToast);
      return;
    }
    setInvalidRows(new Set());
    openConfirmation(valid);
  };

  const handleBulk = () => {
    const keys = rows.map((row) => `${row.scopeType}:${row.branchId}`);
    const { invalid, valid } = buildMovements(keys);
    setInvalidRows(invalid);
    if (invalid.size > 0) {
      toast.error(labels.invalidToast);
      return;
    }
    if (valid.length === 0) {
      toast.error(labels.invalidToast);
      return;
    }
    openConfirmation(valid);
  };

  const confirmApply = async () => {
    if (pendingMovements.length === 0) {
      setConfirmOpen(false);
      return;
    }
    setIsApplying(true);
    try {
      for (const movement of pendingMovements) {
        const response = await fetch("/api/admin/inventory/movements", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            productId: movement.productId,
            delta: movement.delta,
            reason: movement.reason,
            scopeType: movement.scopeType,
            branchId: movement.branchId
          })
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const code = typeof payload?.code === "string" ? payload.code : "UNKNOWN";
          throw new Error(code);
        }
      }

      setAdjustments((current) => {
        const next = { ...current };
        for (const movement of pendingMovements) {
          delete next[movement.key];
        }
        return next;
      });
      setInvalidRows(new Set());
      toast.success(labels.apply);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "INVENTORY_STOCK_WRITE_FAILED");
    } finally {
      setIsApplying(false);
      setConfirmOpen(false);
      setPendingMovements([]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button type="button" className="bg-accent-500 text-base-950 hover:bg-accent-500/90" onClick={handleBulk}>
          {labels.bulkAdjust}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{labels.branch}</TableHead>
            <TableHead className="text-right">{labels.available}</TableHead>
            <TableHead className="text-right">{labels.reserved}</TableHead>
            <TableHead className="text-right">{labels.total}</TableHead>
            <TableHead>{labels.state}</TableHead>
            <TableHead>{labels.adjust}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const key = `${row.scopeType}:${row.branchId}`;
            const state = getStockState(row.total);
            const value = adjustments[key] ?? { delta: "", reason: "" };
            const hasInvalid = invalidRows.has(key);

            return (
              <TableRow key={key}>
                <TableCell>
                  <div className="font-medium text-white">{row.branchName}</div>
                  <div className="text-xs text-white/50">{row.branchCity ?? labels.digitalScope}</div>
                </TableCell>
                <TableCell className="text-right font-semibold text-white">{row.available}</TableCell>
                <TableCell className="text-right text-white/70">{row.reserved}</TableCell>
                <TableCell className="text-right font-semibold text-white">{row.total}</TableCell>
                <TableCell>
                  <Badge state={state}>{stateLabel(state)}</Badge>
                </TableCell>
                <TableCell className="min-w-[240px]">
                  <div className={`space-y-2 rounded-lg border p-2 ${hasInvalid ? "border-rose-500/70" : "border-white/10"}`}>
                    <div className="flex items-center overflow-hidden rounded-lg border border-white/10 bg-base-900">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 w-10 rounded-none border-r border-white/10 px-0 text-lg text-white hover:bg-white/10"
                        onClick={() => {
                          const current = Number.parseInt(value.delta || "0", 10);
                          const safe = Number.isInteger(current) ? current : 0;
                          setAdjustment(key, { delta: String(safe - 1) });
                        }}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        value={value.delta}
                        onChange={(event) => setAdjustment(key, { delta: event.target.value })}
                        className="h-9 rounded-none border-none bg-transparent text-center font-semibold text-white focus-visible:ring-0"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 w-10 rounded-none border-l border-white/10 px-0 text-lg text-white hover:bg-white/10"
                        onClick={() => {
                          const current = Number.parseInt(value.delta || "0", 10);
                          const safe = Number.isInteger(current) ? current : 0;
                          setAdjustment(key, { delta: String(safe + 1) });
                        }}
                      >
                        +
                      </Button>
                    </div>
                    <Input
                      value={value.reason}
                      onChange={(event) => setAdjustment(key, { reason: event.target.value })}
                      className="h-8 border-white/10 bg-base-900 text-white"
                      placeholder={labels.reason}
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 w-full bg-accent-500 text-base-950 hover:bg-accent-500/90"
                      onClick={() => handleSingle(key)}
                    >
                      {labels.apply}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-white/10 bg-base-900 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {labels.confirmDescription.replace("{count}", String(pendingMovements.length))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/10">
              {labels.confirmCancel}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-accent-500 text-base-950 hover:bg-accent-500/90"
              onClick={(event) => {
                event.preventDefault();
                if (isApplying) {
                  return;
                }
                void confirmApply();
              }}
            >
              {labels.confirmContinue}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
