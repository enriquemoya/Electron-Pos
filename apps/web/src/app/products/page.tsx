"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Expansion,
  GameType,
  Product,
  ProductCategory,
  ProductListItem,
  ProductStockStatus,
  ProductAlertSettings
} from "@pos/core";
import { createInventoryState, createMoney } from "@pos/core";
import type { InventoryState } from "@pos/core";
import { t } from "./i18n";
import { exportProductsToExcel } from "./services/excel-export";
import { importProductsFromExcel } from "./services/excel-import";
import { applyImportResult } from "./services/apply-import";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ProductFormState = {
  name: string;
  category: ProductCategory;
  price: string;
  isStockTracked: boolean;
  initialStock: string;
  gameTypeId: string;
  expansionId: string;
};

type AlertFormState = {
  minStock: string;
  alertsEnabled: boolean;
  outOfStockEnabled: boolean;
};

const initialForm: ProductFormState = {
  name: "",
  category: "TCG_SEALED",
  price: "",
  isStockTracked: true,
  initialStock: "",
  gameTypeId: "none",
  expansionId: "none"
};

const initialAlertForm: AlertFormState = {
  minStock: "0",
  alertsEnabled: false,
  outOfStockEnabled: false
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount / 100);
}

function categoryLabel(category: ProductCategory) {
  switch (category) {
    case "TCG_SEALED":
      return t("categoryTCGSealed");
    case "TCG_SINGLE":
      return t("categoryTCGSingle");
    case "ACCESSORY":
      return t("categoryAccessory");
    case "COMMODITY":
      return t("categoryCommodity");
    case "SERVICE":
      return t("categoryService");
  }
}

declare global {
  interface Window {
    api?: {
      products: {
        getProducts: () => Promise<Product[]>;
        listPaged: (filters: {
          search?: string;
          category?: ProductCategory;
          gameTypeId?: string;
          stockStatus?: ProductStockStatus;
          sortBy?: "NAME" | "CREATED_AT" | "STOCK";
          sortDir?: "ASC" | "DESC";
          page?: number;
          pageSize?: number;
        }) => Promise<{
          items: ProductListItem[];
          total: number;
          page: number;
          pageSize: number;
        }>;
        createProduct: (product: Product) => Promise<void>;
        updateProduct: (product: Product) => Promise<void>;
      };
      inventory: {
        getInventory: () => Promise<InventoryState>;
        updateStock: (productId: string, delta: number) => Promise<InventoryState>;
      };
      inventoryAlerts: {
        getProductAlertSettings: (productId: string) => Promise<ProductAlertSettings>;
        updateProductAlertSettings: (
          productId: string,
          settings: Omit<ProductAlertSettings, "productId" | "updatedAt">
        ) => Promise<ProductAlertSettings>;
      };
      gameTypes: {
        listGameTypes: (activeOnly?: boolean) => Promise<GameType[]>;
      };
      expansions: {
        getExpansionsByGame: (gameTypeId: string, includeInactive?: boolean) => Promise<Expansion[]>;
        getExpansionById: (expansionId: string) => Promise<Expansion | null>;
      };
    };
  }
}

export default function ProductsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReturnType<typeof importProductsFromExcel>["summary"] | null>(null);
  const [gameTypes, setGameTypes] = useState<GameType[]>([]);
  const [expansions, setExpansions] = useState<Expansion[]>([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ProductCategory | "ALL">("ALL");
  const [gameTypeId, setGameTypeId] = useState<string>("ALL");
  const [stockStatus, setStockStatus] = useState<ProductStockStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"NAME" | "CREATED_AT" | "STOCK">("CREATED_AT");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [alertForm, setAlertForm] = useState<AlertFormState>(initialAlertForm);
  const [alertError, setAlertError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const gameTypeMap = useMemo(() => {
    const map = new Map<string, GameType>();
    gameTypes.forEach((game) => map.set(game.id, game));
    return map;
  }, [gameTypes]);

  const expansionMap = useMemo(() => {
    const map = new Map<string, Expansion>();
    expansions.forEach((expansion) => map.set(expansion.id, expansion));
    return map;
  }, [expansions]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const loadGameTypes = async () => {
    const api = window.api;
    if (!api) {
      return;
    }
    const list = await api.gameTypes.listGameTypes(true);
    setGameTypes(list ?? []);
  };

  const loadProducts = async () => {
    const api = window.api;
    if (!api) {
      return;
    }
    setLoading(true);
    try {
      const response = await api.products.listPaged({
        search: search.trim() || undefined,
        category: category === "ALL" ? undefined : category,
        gameTypeId: gameTypeId === "ALL" ? undefined : gameTypeId,
        stockStatus: stockStatus === "ALL" ? undefined : stockStatus,
        sortBy,
        sortDir,
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
  }, []);

  useEffect(() => {
    const api = window.api;
    if (!api || (!createOpen && !editOpen)) {
      return;
    }
    if (form.gameTypeId === "none") {
      setExpansions([]);
      return;
    }
    api.expansions
      .getExpansionsByGame(form.gameTypeId, true)
      .then((list) => setExpansions(list ?? []))
      .catch(() => setExpansions([]));
  }, [form.gameTypeId, createOpen, editOpen]);

  useEffect(() => {
    loadProducts();
  }, [search, category, gameTypeId, stockStatus, sortBy, sortDir, page, pageSize]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const api = window.api;
    if (!api) {
      return;
    }
    const buffer = await file.arrayBuffer();
    const [allProducts, inventory] = await Promise.all([
      api.products.getProducts(),
      api.inventory.getInventory()
    ]);

    const result = importProductsFromExcel({
      file: buffer,
      products: allProducts ?? [],
      inventory: inventory ?? createInventoryState(),
      nowIso: new Date().toISOString(),
      createId: () => crypto.randomUUID()
    });

    await applyImportResult(result, allProducts ?? [], inventory ?? createInventoryState());
    setSummary(result.summary);
    event.target.value = "";
    await loadProducts();
  };

  const handleExport = async () => {
    const api = window.api;
    if (!api) {
      return;
    }
    const [allProducts, inventory] = await Promise.all([
      api.products.getProducts(),
      api.inventory.getInventory()
    ]);
    const blob = exportProductsToExcel({
      products: allProducts ?? [],
      inventory: inventory ?? createInventoryState()
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = t("exportFilename");
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const openCreate = () => {
    setForm(initialForm);
    setFormError(null);
    setCreateOpen(true);
  };

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      price: (product.price.amount / 100).toFixed(2),
      isStockTracked: product.isStockTracked,
      initialStock: "",
      gameTypeId: product.gameTypeId ?? "none",
      expansionId: product.expansionId ?? "none"
    });
    setFormError(null);
    setEditOpen(true);
  };

  const openAlerts = async (product: Product) => {
    const api = window.api;
    if (!api) {
      return;
    }
    const settings = await api.inventoryAlerts.getProductAlertSettings(product.id);
    setSelectedProduct(product);
    setAlertForm({
      minStock: settings.minStock.toString(),
      alertsEnabled: settings.alertsEnabled,
      outOfStockEnabled: settings.outOfStockEnabled
    });
    setAlertError(null);
    setAlertOpen(true);
  };

  const handleSaveProduct = async (mode: "create" | "edit") => {
    const api = window.api;
    if (!api) {
      return;
    }
    if (!form.name.trim()) {
      setFormError(t("errorMissingName"));
      return;
    }

    const priceValue = Number(form.price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setFormError(t("errorInvalidPrice"));
      return;
    }

    if (form.expansionId !== "none" && form.gameTypeId === "none") {
      setFormError(t("errorExpansionRequiresGame"));
      return;
    }

    const now = new Date().toISOString();
    const gameType = form.gameTypeId !== "none" ? gameTypeMap.get(form.gameTypeId) : null;
    const selectedExpansion =
      form.expansionId !== "none" ? expansionMap.get(form.expansionId) : null;
    if (selectedExpansion && selectedExpansion.gameTypeId !== gameType?.id) {
      setFormError(t("errorExpansionMismatch"));
      return;
    }

    const tcgBase = selectedProduct?.tcg ? { ...selectedProduct.tcg } : undefined;
    let tcg = tcgBase ? { ...tcgBase } : undefined;
    if (gameType) {
      tcg = { ...(tcg ?? {}), game: gameType.name };
    } else if (tcg) {
      delete tcg.game;
    }
    if (selectedExpansion) {
      tcg = { ...(tcg ?? {}), expansion: selectedExpansion.name };
    } else if (tcg) {
      delete tcg.expansion;
    }
    if (tcg && Object.values(tcg).every((value) => value === undefined)) {
      tcg = undefined;
    }

    try {
      if (mode === "create") {
        const newProduct: Product = {
          id: crypto.randomUUID(),
          name: form.name.trim(),
          category: form.category,
          price: createMoney(Math.round(priceValue * 100)),
          isStockTracked: form.isStockTracked,
          gameTypeId: gameType?.id ?? null,
          expansionId: selectedExpansion?.id ?? null,
          createdAt: now,
          updatedAt: now,
          tcg
        };
        await api.products.createProduct(newProduct);

        if (newProduct.isStockTracked) {
          const desired = Number.parseInt(form.initialStock, 10);
          if (Number.isFinite(desired) && desired > 0) {
            await api.inventory.updateStock(newProduct.id, desired);
          }
        }

        await api.inventoryAlerts.updateProductAlertSettings(newProduct.id, {
          minStock: 0,
          alertsEnabled: false,
          outOfStockEnabled: false
        });
      } else if (selectedProduct) {
        const updated: Product = {
          ...selectedProduct,
          name: form.name.trim(),
          category: form.category,
          price: createMoney(Math.round(priceValue * 100)),
          isStockTracked: form.isStockTracked,
          gameTypeId: gameType?.id ?? null,
          expansionId: selectedExpansion?.id ?? null,
          tcg,
          updatedAt: now
        };
        await api.products.updateProduct(updated);
      }

      setCreateOpen(false);
      setEditOpen(false);
      setSelectedProduct(null);
      setForm(initialForm);
      setFormError(null);
      await loadProducts();
    } catch {
      setFormError(t("errorUnknown"));
    }
  };

  const saveAlertSettings = async () => {
    const api = window.api;
    if (!api || !selectedProduct) {
      return;
    }
    const minStockValue = Number.parseInt(alertForm.minStock, 10);
    if (!Number.isFinite(minStockValue) || minStockValue < 0) {
      setAlertError(t("alertInvalidMinStock"));
      return;
    }
    try {
      await api.inventoryAlerts.updateProductAlertSettings(selectedProduct.id, {
        minStock: minStockValue,
        alertsEnabled: alertForm.alertsEnabled,
        outOfStockEnabled: alertForm.outOfStockEnabled
      });
      setAlertOpen(false);
      setSelectedProduct(null);
      setAlertError(null);
      await loadProducts();
    } catch {
      setAlertError(t("errorAlertSettings"));
    }
  };

  const resetFilters = () => {
    setSearch("");
    setCategory("ALL");
    setGameTypeId("ALL");
    setStockStatus("ALL");
    setSortBy("CREATED_AT");
    setSortDir("DESC");
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
          <p className="text-sm text-zinc-400">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={openCreate}
            className="bg-accent-500 text-black hover:bg-accent-600"
          >
            {t("addProduct")}
          </Button>
          <Button variant="outline" onClick={handleExport} className="border-white/10 text-white">
            {t("exportExcel")}
          </Button>
          <Button variant="outline" onClick={handleFileClick} className="border-white/10 text-white">
            {t("importExcel")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </header>

      <Card className="rounded-2xl border border-white/10 bg-base-900 p-4">
        <div className="mb-4 text-sm font-semibold text-white">{t("filtersTitle")}</div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("filterSearchLabel")}
            </label>
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("searchPlaceholder")}
              className="border-white/10 bg-base-900 text-white"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("filterCategoryLabel")}
            </label>
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value as ProductCategory | "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger className="border-white/10 bg-base-900 text-white">
                <SelectValue placeholder={t("filterAll")} />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-base-900 text-white">
                <SelectItem value="ALL">{t("filterAll")}</SelectItem>
                <SelectItem value="TCG_SEALED">{t("categoryTCGSealed")}</SelectItem>
                <SelectItem value="TCG_SINGLE">{t("categoryTCGSingle")}</SelectItem>
                <SelectItem value="ACCESSORY">{t("categoryAccessory")}</SelectItem>
                <SelectItem value="COMMODITY">{t("categoryCommodity")}</SelectItem>
                <SelectItem value="SERVICE">{t("categoryService")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("filterGameTypeLabel")}
            </label>
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
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("filterStockLabel")}
            </label>
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
                <SelectItem value="NORMAL">{t("stockStatusNormal")}</SelectItem>
                <SelectItem value="LOW">{t("stockStatusLow")}</SelectItem>
                <SelectItem value="OUT">{t("stockStatusOut")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("filterSortLabel")}
            </label>
            <Select
              value={`${sortBy}:${sortDir}`}
              onValueChange={(value) => {
                const [nextSort, nextDir] = value.split(":");
                setSortBy(nextSort as "NAME" | "CREATED_AT" | "STOCK");
                setSortDir(nextDir as "ASC" | "DESC");
                setPage(1);
              }}
            >
              <SelectTrigger className="border-white/10 bg-base-900 text-white">
                <SelectValue placeholder={t("sortCreatedDesc")} />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-base-900 text-white">
                <SelectItem value="CREATED_AT:DESC">{t("sortCreatedDesc")}</SelectItem>
                <SelectItem value="CREATED_AT:ASC">{t("sortCreatedAsc")}</SelectItem>
                <SelectItem value="NAME:ASC">{t("sortNameAsc")}</SelectItem>
                <SelectItem value="NAME:DESC">{t("sortNameDesc")}</SelectItem>
                <SelectItem value="STOCK:DESC">{t("sortStockDesc")}</SelectItem>
                <SelectItem value="STOCK:ASC">{t("sortStockAsc")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            {t("resultCount", { count: total })}
          </div>
          <Button variant="outline" onClick={resetFilters} className="border-white/10 text-white">
            {t("resetFilters")}
          </Button>
        </div>
      </Card>

      <Card className="rounded-2xl border border-white/10 bg-base-900 p-4">
        {loading ? <div className="text-sm text-zinc-400">{t("loading")}</div> : null}
        {error ? <div className="text-sm text-rose-300">{error}</div> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tableName")}</TableHead>
              <TableHead>{t("tableCategory")}</TableHead>
              <TableHead>{t("tableGameType")}</TableHead>
              <TableHead>{t("tablePrice")}</TableHead>
              <TableHead>{t("tableStock")}</TableHead>
              <TableHead>{t("tableStatus")}</TableHead>
              <TableHead className="text-right">{t("tableActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-zinc-400">
                  {t("emptyState")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const gameName =
                  item.product.gameTypeId && gameTypeMap.get(item.product.gameTypeId)
                    ? gameTypeMap.get(item.product.gameTypeId)?.name
                    : t("gameTypeEmpty");
                const stockLabel = item.product.isStockTracked
                  ? item.stock ?? 0
                  : t("stockUnlimited");

                return (
                  <TableRow key={item.product.id}>
                    <TableCell className="font-semibold text-white">{item.product.name}</TableCell>
                    <TableCell>{categoryLabel(item.product.category)}</TableCell>
                    <TableCell>{gameName}</TableCell>
                    <TableCell>{formatMoney(item.product.price.amount)}</TableCell>
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
                        {item.stockStatus === "OUT"
                          ? t("stockStatusOut")
                          : item.stockStatus === "LOW"
                            ? t("stockStatusLow")
                            : t("stockStatusNormal")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 text-white"
                          onClick={() => openEdit(item.product)}
                        >
                          {t("editAction")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 text-white"
                          onClick={() => openAlerts(item.product)}
                        >
                          {t("alertConfigAction")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            {t("pageLabel", { page, total: pageCount })}
          </div>
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
              <SelectTrigger className="h-8 w-[110px] border-white/10 bg-base-900 text-white">
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

      {summary ? (
        <div className="rounded-2xl border border-white/10 bg-base-900 p-4 text-sm text-white">
          {t("importTitle")} · {t("importCreated")}: {summary.created} · {t("importUpdated")}:
          {summary.updated} · {t("importErrors")}: {summary.errors.length}
        </div>
      ) : null}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-white/10 bg-base-900 text-white">
          <DialogHeader>
            <DialogTitle>{t("createModalTitle")}</DialogTitle>
          </DialogHeader>
          <ProductForm
            form={form}
            onChange={setForm}
            gameTypes={gameTypes}
            expansions={expansions}
            allowInitialStock
          />
          {formError ? <div className="text-xs text-rose-300">{formError}</div> : null}
          <DialogFooter className="gap-2 sm:justify-start">
            <Button onClick={() => handleSaveProduct("create")} className="bg-accent-500 text-black">
              {t("createSubmit")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="border-white/10 text-white"
            >
              {t("cancelAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="border-white/10 bg-base-900 text-white">
          <DialogHeader>
            <DialogTitle>{t("editModalTitle")}</DialogTitle>
          </DialogHeader>
          <ProductForm
            form={form}
            onChange={setForm}
            gameTypes={gameTypes}
            expansions={expansions}
          />
          {formError ? <div className="text-xs text-rose-300">{formError}</div> : null}
          <DialogFooter className="gap-2 sm:justify-start">
            <Button onClick={() => handleSaveProduct("edit")} className="bg-accent-500 text-black">
              {t("saveAction")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="border-white/10 text-white"
            >
              {t("cancelAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="border-white/10 bg-base-900 text-white">
          <DialogHeader>
            <DialogTitle>{t("alertSettingsTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {t("alertMinStockLabel")}
              </label>
              <Input
                value={alertForm.minStock}
                onChange={(event) =>
                  setAlertForm((current) => ({ ...current, minStock: event.target.value }))
                }
                className="border-white/10 bg-base-900 text-white"
              />
            </div>
            <ToggleSelect
              label={t("alertEnableLabel")}
              value={alertForm.alertsEnabled}
              onChange={(value) =>
                setAlertForm((current) => ({ ...current, alertsEnabled: value }))
              }
            />
            <ToggleSelect
              label={t("alertOutOfStockLabel")}
              value={alertForm.outOfStockEnabled}
              onChange={(value) =>
                setAlertForm((current) => ({ ...current, outOfStockEnabled: value }))
              }
            />
          </div>
          {alertError ? <div className="text-xs text-rose-300">{alertError}</div> : null}
          <DialogFooter className="gap-2 sm:justify-start">
            <Button onClick={saveAlertSettings} className="bg-accent-500 text-black">
              {t("alertSaveAction")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setAlertOpen(false)}
              className="border-white/10 text-white"
            >
              {t("cancelAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductForm({
  form,
  onChange,
  gameTypes,
  expansions,
  allowInitialStock = false
}: {
  form: ProductFormState;
  onChange: (next: ProductFormState) => void;
  gameTypes: GameType[];
  expansions: Expansion[];
  allowInitialStock?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          {t("createNameLabel")}
        </label>
        <Input
          value={form.name}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
          placeholder={t("createNamePlaceholder")}
          className="border-white/10 bg-base-900 text-white"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          {t("createCategoryLabel")}
        </label>
        <Select
          value={form.category}
          onValueChange={(value) => onChange({ ...form, category: value as ProductCategory })}
        >
          <SelectTrigger className="border-white/10 bg-base-900 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-base-900 text-white">
            <SelectItem value="TCG_SEALED">{t("categoryTCGSealed")}</SelectItem>
            <SelectItem value="TCG_SINGLE">{t("categoryTCGSingle")}</SelectItem>
            <SelectItem value="ACCESSORY">{t("categoryAccessory")}</SelectItem>
            <SelectItem value="COMMODITY">{t("categoryCommodity")}</SelectItem>
            <SelectItem value="SERVICE">{t("categoryService")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          {t("createPriceLabel")}
        </label>
        <Input
          value={form.price}
          onChange={(event) => onChange({ ...form, price: event.target.value })}
          placeholder={t("createPricePlaceholder")}
          className="border-white/10 bg-base-900 text-white"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          {t("createStockTrackedLabel")}
        </label>
        <Select
          value={form.isStockTracked ? "true" : "false"}
          onValueChange={(value) => onChange({ ...form, isStockTracked: value === "true" })}
        >
          <SelectTrigger className="border-white/10 bg-base-900 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-base-900 text-white">
            <SelectItem value="true">{t("yes")}</SelectItem>
            <SelectItem value="false">{t("no")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          {t("gameTypeLabel")}
        </label>
        <Select
          value={form.gameTypeId}
          onValueChange={(value) =>
            onChange({
              ...form,
              gameTypeId: value,
              expansionId: "none"
            })
          }
        >
          <SelectTrigger className="border-white/10 bg-base-900 text-white">
            <SelectValue placeholder={t("gameTypePlaceholder")} />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-base-900 text-white">
            <SelectItem value="none">{t("gameTypeEmpty")}</SelectItem>
            {gameTypes.map((game) => (
              <SelectItem key={game.id} value={game.id}>
                {game.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          {t("expansionLabel")}
        </label>
        <Select
          value={form.expansionId}
          onValueChange={(value) => onChange({ ...form, expansionId: value })}
          disabled={form.gameTypeId === "none"}
        >
          <SelectTrigger className="border-white/10 bg-base-900 text-white">
            <SelectValue placeholder={t("expansionPlaceholder")} />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-base-900 text-white">
            <SelectItem value="none">{t("expansionEmpty")}</SelectItem>
            {expansions.map((expansion) => (
              <SelectItem key={expansion.id} value={expansion.id} disabled={!expansion.active}>
                {expansion.name}
                {!expansion.active ? ` (${t("expansionInactive")})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {allowInitialStock ? (
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {t("createStockLabel")}
          </label>
          <Input
            value={form.initialStock}
            onChange={(event) => onChange({ ...form, initialStock: event.target.value })}
            placeholder={t("createStockPlaceholder")}
            className="border-white/10 bg-base-900 text-white"
          />
        </div>
      ) : null}
    </div>
  );
}

function ToggleSelect({
  label,
  value,
  onChange
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</label>
      <Select
        value={value ? "true" : "false"}
        onValueChange={(next) => onChange(next === "true")}
      >
        <SelectTrigger className="border-white/10 bg-base-900 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-base-900 text-white">
          <SelectItem value="true">{t("yes")}</SelectItem>
          <SelectItem value="false">{t("no")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}


