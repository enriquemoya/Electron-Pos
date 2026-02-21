"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

type InventoryScopeType = "ONLINE_STORE" | "BRANCH";

type Branch = {
  id: string;
  name: string;
};

type Taxonomy = {
  id: string;
  name: string;
};

type InventoryItem = {
  productId: string;
  displayName: string | null;
  slug: string | null;
  category: string | null;
  game: string | null;
  available: number;
  reserved?: number;
  total?: number;
  categoryId?: string | null;
  gameId?: string | null;
  expansionId?: string | null;
};

type FiltersState = {
  scopeType: InventoryScopeType;
  branchId: string;
  query: string;
  gameId: string;
  categoryId: string;
  expansionId: string;
  stockState: string;
};

type AdjustmentValue = {
  delta: string;
  reason: string;
};

type PendingMovement = {
  productId: string;
  delta: number;
  reason: string;
  scopeType: InventoryScopeType;
  branchId: string | null;
  key: string;
};

type Props = {
  locale: string;
  title: string;
  subtitle: string;
  labels: {
    product: string;
    sku: string;
    available: string;
    reserved: string;
    total: string;
    state: string;
    adjust: string;
    action: string;
    noGame: string;
    empty: string;
    apply: string;
    reset: string;
    exportCsv: string;
    bulkAdjust: string;
    view: string;
    reason: string;
    scope: string;
    onlineStore: string;
    branch: string;
    branchLabel: string;
    game: string;
    allGames: string;
    category: string;
    allCategories: string;
    expansion: string;
    allExpansions: string;
    stockState: string;
    allStockStates: string;
    search: string;
    searchPlaceholder: string;
    availableState: string;
    lowStockState: string;
    soldOutState: string;
    confirmTitle: string;
    confirmDescription: string;
    confirmContinue: string;
    confirmCancel: string;
    invalidToast: string;
  };
  branches: Branch[];
  games: Taxonomy[];
  categories: Taxonomy[];
  expansions: Taxonomy[];
  items: InventoryItem[];
  initialFilters: FiltersState;
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

function toCsv(rows: InventoryItem[]) {
  const header = ["productId", "product", "sku", "available", "reserved", "total", "category", "game"];
  const lines = rows.map((row) => {
    const available = row.available ?? 0;
    const reserved = row.reserved ?? 0;
    const total = row.total ?? available + reserved;
    return [
      row.productId,
      row.displayName ?? "",
      row.slug ?? "",
      String(available),
      String(reserved),
      String(total),
      row.category ?? "",
      row.game ?? ""
    ];
  });
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return [header, ...lines].map((line) => line.map(escape).join(",")).join("\n");
}

export function InventoryListScreen({
  locale,
  title,
  subtitle,
  labels,
  branches,
  games,
  categories,
  expansions,
  items,
  initialFilters
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [adjustments, setAdjustments] = useState<Record<string, AdjustmentValue>>({});
  const [invalidRows, setInvalidRows] = useState<Set<string>>(new Set());
  const [pendingMovements, setPendingMovements] = useState<PendingMovement[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const selectedBranchId =
    filters.scopeType === "BRANCH" ? (filters.branchId || branches[0]?.id || "") : "";

  const list = useMemo(() => items, [items]);

  const stockStateLabel = (state: "AVAILABLE" | "LOW_STOCK" | "SOLD_OUT") => {
    if (state === "SOLD_OUT") {
      return labels.soldOutState;
    }
    if (state === "LOW_STOCK") {
      return labels.lowStockState;
    }
    return labels.availableState;
  };

  const setAdjustment = (key: string, next: Partial<AdjustmentValue>) => {
    setAdjustments((current) => ({
      ...current,
      [key]: {
        delta: current[key]?.delta ?? "",
        reason: current[key]?.reason ?? "",
        ...next
      }
    }));
  };

  const validateRow = (key: string) => {
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

    return {
      status: "valid" as const,
      delta,
      reason: value.reason.trim()
    };
  };

  const buildMovements = (keys: string[]) => {
    const invalid = new Set<string>();
    const valid: PendingMovement[] = [];

    for (const key of keys) {
      const validation = validateRow(key);
      if (validation.status === "empty") {
        continue;
      }
      if (validation.status === "invalid") {
        invalid.add(key);
        continue;
      }

      valid.push({
        key,
        productId: key,
        delta: validation.delta,
        reason: validation.reason,
        scopeType: filters.scopeType,
        branchId: filters.scopeType === "BRANCH" ? selectedBranchId || null : null
      });
    }

    return { invalid, valid };
  };

  const handleApplyFilters = () => {
    if (filters.scopeType === "BRANCH" && !selectedBranchId) {
      toast.error(labels.branchLabel);
      return;
    }

    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", "20");
    params.set("scopeType", filters.scopeType);
    if (filters.scopeType === "BRANCH" && selectedBranchId) {
      params.set("branchId", selectedBranchId);
    }
    if (filters.query.trim()) {
      params.set("query", filters.query.trim());
    }
    if (filters.gameId !== "ALL") {
      params.set("gameId", filters.gameId);
    }
    if (filters.categoryId !== "ALL") {
      params.set("categoryId", filters.categoryId);
    }
    if (filters.expansionId !== "ALL") {
      params.set("expansionId", filters.expansionId);
    }
    if (filters.stockState !== "ALL") {
      params.set("stockState", filters.stockState);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setFilters({
      scopeType: "ONLINE_STORE",
      branchId: "",
      query: "",
      gameId: "ALL",
      categoryId: "ALL",
      expansionId: "ALL",
      stockState: "ALL"
    });
    router.push(`/${locale}/admin/inventory`);
  };

  const handleExport = () => {
    const csv = toCsv(list);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const openConfirmation = (movements: PendingMovement[]) => {
    setPendingMovements(movements);
    setConfirmOpen(true);
  };

  const handleSingleApply = (key: string) => {
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

  const handleBulkApply = () => {
    const keys = list.map((row) => row.productId);
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-white">{title}</h1>
          <p className="text-sm text-white/60">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-10 border-white/10 text-white" onClick={handleExport}>
            {labels.exportCsv}
          </Button>
          <Button type="button" className="h-10 bg-accent-500 text-base-950 hover:bg-accent-500/90" onClick={handleBulkApply}>
            {labels.bulkAdjust}
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="grid gap-4 lg:grid-cols-6">
          <div className="space-y-1">
            <Label htmlFor="scopeType">{labels.scope}</Label>
            <Select
              value={filters.scopeType}
              onValueChange={(value) => {
                const scopeType = value === "BRANCH" ? "BRANCH" : "ONLINE_STORE";
                setFilters((current) => ({
                  ...current,
                  scopeType,
                  branchId: scopeType === "BRANCH" ? (current.branchId || branches[0]?.id || "") : ""
                }));
              }}
            >
              <SelectTrigger id="scopeType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONLINE_STORE">{labels.onlineStore}</SelectItem>
                <SelectItem value="BRANCH">{labels.branch}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="branchId">{labels.branchLabel}</Label>
            <Select
              value={selectedBranchId || (branches[0]?.id ?? "")}
              onValueChange={(value) => setFilters((current) => ({ ...current, branchId: value }))}
              disabled={filters.scopeType !== "BRANCH"}
            >
              <SelectTrigger id="branchId">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="gameId">{labels.game}</Label>
            <Select value={filters.gameId} onValueChange={(value) => setFilters((current) => ({ ...current, gameId: value }))}>
              <SelectTrigger id="gameId">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{labels.allGames}</SelectItem>
                {games.map((taxonomy) => (
                  <SelectItem key={taxonomy.id} value={taxonomy.id}>
                    {taxonomy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="categoryId">{labels.category}</Label>
            <Select value={filters.categoryId} onValueChange={(value) => setFilters((current) => ({ ...current, categoryId: value }))}>
              <SelectTrigger id="categoryId">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{labels.allCategories}</SelectItem>
                {categories.map((taxonomy) => (
                  <SelectItem key={taxonomy.id} value={taxonomy.id}>
                    {taxonomy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="expansionId">{labels.expansion}</Label>
            <Select value={filters.expansionId} onValueChange={(value) => setFilters((current) => ({ ...current, expansionId: value }))}>
              <SelectTrigger id="expansionId">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{labels.allExpansions}</SelectItem>
                {expansions.map((taxonomy) => (
                  <SelectItem key={taxonomy.id} value={taxonomy.id}>
                    {taxonomy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="stockState">{labels.stockState}</Label>
            <Select value={filters.stockState} onValueChange={(value) => setFilters((current) => ({ ...current, stockState: value }))}>
              <SelectTrigger id="stockState">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{labels.allStockStates}</SelectItem>
                <SelectItem value="AVAILABLE">{labels.availableState}</SelectItem>
                <SelectItem value="LOW_STOCK">{labels.lowStockState}</SelectItem>
                <SelectItem value="SOLD_OUT">{labels.soldOutState}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 lg:col-span-4">
            <Label htmlFor="query">{labels.search}</Label>
            <Input
              id="query"
              value={filters.query}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
              placeholder={labels.searchPlaceholder}
            />
          </div>

          <div className="flex flex-wrap items-end justify-end gap-2 lg:col-span-2">
            <Button type="button" className="h-10 min-w-[120px] bg-accent-500 text-base-950 hover:bg-accent-500/90" onClick={handleApplyFilters}>
              {labels.apply}
            </Button>
            <Button type="button" variant="outline" className="h-10 min-w-[120px] border-white/10 text-white" onClick={handleResetFilters}>
              {labels.reset}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{labels.product}</TableHead>
              <TableHead>{labels.sku}</TableHead>
              <TableHead className="text-right">{labels.available}</TableHead>
              <TableHead className="text-right">{labels.reserved}</TableHead>
              <TableHead className="text-right">{labels.total}</TableHead>
              <TableHead>{labels.state}</TableHead>
              <TableHead>{labels.adjust}</TableHead>
              <TableHead>{labels.action}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-white/60">
                  {labels.empty}
                </TableCell>
              </TableRow>
            ) : (
              list.map((item) => {
                const available = item.available ?? 0;
                const reserved = item.reserved ?? 0;
                const total = item.total ?? available + reserved;
                const state = getStockState(total);
                const value = adjustments[item.productId] ?? { delta: "", reason: "" };
                const hasInvalid = invalidRows.has(item.productId);
                const deltaNumber = Number.parseInt(value.delta || "0", 10);

                return (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <div className="font-medium text-white">{item.displayName ?? item.productId}</div>
                      <div className="text-xs text-white/50">{item.game ?? labels.noGame}</div>
                    </TableCell>
                    <TableCell className="text-white/60">{item.slug ?? "--"}</TableCell>
                    <TableCell className="text-right font-semibold text-white">{available}</TableCell>
                    <TableCell className="text-right text-white/70">{reserved}</TableCell>
                    <TableCell className="text-right font-semibold text-white">{total}</TableCell>
                    <TableCell>
                      <Badge state={state}>{stockStateLabel(state)}</Badge>
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
                              setAdjustment(item.productId, { delta: String(safe - 1) });
                            }}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            value={value.delta}
                            onChange={(event) => setAdjustment(item.productId, { delta: event.target.value })}
                            className="h-9 rounded-none border-none bg-transparent text-center font-semibold text-white focus-visible:ring-0"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-9 w-10 rounded-none border-l border-white/10 px-0 text-lg text-white hover:bg-white/10"
                            onClick={() => {
                              const current = Number.parseInt(value.delta || "0", 10);
                              const safe = Number.isInteger(current) ? current : 0;
                              setAdjustment(item.productId, { delta: String(safe + 1) });
                            }}
                          >
                            +
                          </Button>
                        </div>
                        <Input
                          value={value.reason}
                          onChange={(event) => setAdjustment(item.productId, { reason: event.target.value })}
                          className="h-8 border-white/10 bg-base-900 text-white"
                          placeholder={labels.reason}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-9 w-full bg-accent-500 text-base-950 hover:bg-accent-500/90"
                          onClick={() => handleSingleApply(item.productId)}
                          disabled={!Number.isInteger(deltaNumber)}
                        >
                          {labels.apply}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button asChild type="button" variant="ghost" className="px-0 text-accent-500 hover:text-accent-400">
                        <Link href={`/${locale}/admin/inventory/${item.productId}`}>{labels.view}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

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
