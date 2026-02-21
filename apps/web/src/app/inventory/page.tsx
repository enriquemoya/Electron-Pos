"use client";

import { useEffect, useMemo, useState } from "react";
import type { GameType, ProductListItem, ProductStockStatus } from "@pos/core";
import { t } from "./i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SessionRole = "ADMIN" | "EMPLOYEE" | null;

type AdjustmentState = {
  amount: string;
  reason: string;
};

function getErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  const message = error instanceof Error ? error.message : "";
  const source = `${code} ${message}`;

  if (source.includes("RBAC_FORBIDDEN")) {
    return t("adjustForbidden");
  }
  if (source.includes("AUTH_SESSION_EXPIRED")) {
    return t("adjustSessionExpired");
  }

  return t("errorLoad");
}

export default function InventoryPage() {
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [gameTypeId, setGameTypeId] = useState("ALL");
  const [stockStatus, setStockStatus] = useState<ProductStockStatus | "ALL">("ALL");

  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [sessionRole, setSessionRole] = useState<SessionRole>(null);
  const [adjustments, setAdjustments] = useState<Record<string, AdjustmentState>>({});
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustNotice, setAdjustNotice] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const gameTypeMap = useMemo(() => {
    const map = new Map<string, GameType>();
    gameTypes.forEach((game) => map.set(game.id, game));
    return map;
  }, [gameTypes]);

  const loadSessionRole = async () => {
    const session = await window.koyotePosUserAuth?.getSession?.();
    if (session?.authenticated && session.user?.role) {
      setSessionRole(session.user.role);
      return;
    }
    setSessionRole(null);
  };

  const loadGameTypes = async () => {
    const api = window.api;
    if (!api) {
      return;
    }
    const list = await api.gameTypes.listGameTypes(true);
    setGameTypes(list ?? []);
  };

  const loadInventory = async () => {
    const api = window.api;
    if (!api) {
      return;
    }
    setLoading(true);
    try {
      const response = await api.products.listPaged({
        search: search.trim() || undefined,
        gameTypeId: gameTypeId === "ALL" ? undefined : gameTypeId,
        stockStatus: stockStatus === "ALL" ? undefined : stockStatus,
        sortBy: "STOCK",
        sortDir: "DESC",
        page,
        pageSize
      });
      setItems(response?.items ?? []);
      setTotal(response?.total ?? 0);
      setError(null);
    } catch {
      setError(t("errorLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGameTypes();
    loadSessionRole().catch(() => {
      setSessionRole(null);
    });
  }, []);

  useEffect(() => {
    loadInventory();
  }, [search, gameTypeId, stockStatus, page, pageSize]);

  const resetFilters = () => {
    setSearch("");
    setGameTypeId("ALL");
    setStockStatus("ALL");
    setPage(1);
  };

  const adjustmentFor = (productId: string): AdjustmentState => {
    return adjustments[productId] ?? { amount: "1", reason: "manual_adjustment" };
  };

  const updateAdjustment = (productId: string, next: Partial<AdjustmentState>) => {
    setAdjustments((current) => ({
      ...current,
      [productId]: {
        ...(current[productId] ?? { amount: "1", reason: "manual_adjustment" }),
        ...next
      }
    }));
  };

  const applyAdjustment = async (productId: string, direction: 1 | -1) => {
    const api = window.api;
    if (!api) {
      return;
    }

    const current = adjustmentFor(productId);
    const amount = Number.parseInt(current.amount, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      setAdjustNotice(t("adjustInvalid"));
      return;
    }

    if (direction < 0 && sessionRole !== "ADMIN") {
      setAdjustNotice(t("adjustForbidden"));
      return;
    }

    setAdjustingId(productId);
    setAdjustNotice(null);
    setError(null);

    try {
      const result = await api.inventory.adjustManual({
        productId,
        delta: direction * amount,
        reason: current.reason || "manual_adjustment"
      });
      setAdjustNotice(result?.queued ? t("adjustQueued") : t("adjustSuccess"));
      await loadInventory();
    } catch (adjustError) {
      setError(getErrorMessage(adjustError));
    } finally {
      setAdjustingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
        <p className="text-sm text-zinc-400">{t("subtitle")}</p>
      </div>

      <Card className="rounded-2xl border border-white/10 bg-base-900 p-4">
        <div className="mb-4 text-sm font-semibold text-white">{t("filtersTitle")}</div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("filterNameLabel")}</label>
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("filterNamePlaceholder")}
              className="border-white/10 bg-base-900 text-white"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("filterGameLabel")}</label>
            <Select
              value={gameTypeId}
              onValueChange={(value) => {
                setGameTypeId(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="border-white/10 bg-base-900 text-white">
                <SelectValue placeholder={t("filterGameAll")} />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-base-900 text-white">
                <SelectItem value="ALL">{t("filterGameAll")}</SelectItem>
                {gameTypes.map((game) => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t("filterStockLabel")}</label>
            <Select
              value={stockStatus}
              onValueChange={(value) => {
                setStockStatus(value as ProductStockStatus | "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger className="border-white/10 bg-base-900 text-white">
                <SelectValue placeholder={t("filterStockAll")} />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-base-900 text-white">
                <SelectItem value="ALL">{t("filterStockAll")}</SelectItem>
                <SelectItem value="NORMAL">{t("stockNormal")}</SelectItem>
                <SelectItem value="LOW">{t("stockLow")}</SelectItem>
                <SelectItem value="OUT">{t("stockOut")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={resetFilters} className="border-white/10 text-white">
            {t("clearFilters")}
          </Button>
        </div>
      </Card>

      <Card className="rounded-2xl border border-white/10 bg-base-900 p-4">
        {loading ? <div className="text-sm text-zinc-400">{t("loading")}</div> : null}
        {error ? <div className="text-sm text-rose-300">{error}</div> : null}
        {adjustNotice ? <div className="text-sm text-emerald-300">{adjustNotice}</div> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tableProduct")}</TableHead>
              <TableHead>{t("tableGame")}</TableHead>
              <TableHead>{t("tableStock")}</TableHead>
              <TableHead>{t("tableStatus")}</TableHead>
              <TableHead>{t("tableAdjust")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-400">
                  {t("emptyState")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const gameName =
                  item.product.gameTypeId && gameTypeMap.get(item.product.gameTypeId)
                    ? gameTypeMap.get(item.product.gameTypeId)?.name
                    : "-";
                const stockLabel = item.product.isStockTracked ? item.stock ?? 0 : "-";
                const statusLabel =
                  item.stockStatus === "OUT"
                    ? t("stockOut")
                    : item.stockStatus === "LOW"
                      ? t("stockLow")
                      : t("stockNormal");
                const rowAdjustment = adjustmentFor(item.product.id);
                const busy = adjustingId === item.product.id;

                return (
                  <TableRow key={item.product.id}>
                    <TableCell className="font-semibold text-white">{item.product.name}</TableCell>
                    <TableCell>{gameName}</TableCell>
                    <TableCell>{stockLabel}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] uppercase ${
                          item.stockStatus === "OUT"
                            ? "bg-rose-500/20 text-rose-200"
                            : item.stockStatus === "LOW"
                              ? "bg-amber-500/20 text-amber-200"
                              : "bg-emerald-500/10 text-emerald-200"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-[320px] flex-wrap items-center gap-2">
                        <Input
                          value={rowAdjustment.amount}
                          onChange={(event) => updateAdjustment(item.product.id, { amount: event.target.value })}
                          className="h-8 w-20 border-white/10 bg-base-900 text-white"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder={t("adjustAmount")}
                        />
                        <Input
                          value={rowAdjustment.reason}
                          onChange={(event) => updateAdjustment(item.product.id, { reason: event.target.value })}
                          className="h-8 min-w-[140px] border-white/10 bg-base-900 text-white"
                          placeholder={t("reasonPlaceholder")}
                        />
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => applyAdjustment(item.product.id, 1)}
                        >
                          {t("increment")}
                        </Button>
                        {sessionRole === "ADMIN" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/10 text-white"
                            disabled={busy}
                            onClick={() => applyAdjustment(item.product.id, -1)}
                          >
                            {t("decrement")}
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">{t("pageLabel", { page, total: pageCount })}</div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-white/10 text-white"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              {t("prevPage")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-white/10 text-white"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            >
              {t("nextPage")}
            </Button>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number.parseInt(value, 10));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[110px] border-white/10 bg-base-900 text-xs text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-base-900 text-white">
                {[10, 20, 30, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {t("pageSizeLabel", { size })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    </div>
  );
}
