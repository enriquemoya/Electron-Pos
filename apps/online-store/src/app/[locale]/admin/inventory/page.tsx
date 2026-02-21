import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { InventoryListScreen } from "@/components/admin/inventory-list-screen";
import { fetchAdminBranches, fetchInventory, fetchTaxonomies } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-guard";

type InventoryScopeType = "ONLINE_STORE" | "BRANCH";

function getStockState(total: number): "AVAILABLE" | "LOW_STOCK" | "SOLD_OUT" {
  if (total <= 0) {
    return "SOLD_OUT";
  }
  if (total < 5) {
    return "LOW_STOCK";
  }
  return "AVAILABLE";
}

export default async function InventoryPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams?: {
    page?: string;
    pageSize?: string;
    query?: string;
    sort?: string;
    direction?: string;
    scopeType?: string;
    branchId?: string;
    gameId?: string;
    categoryId?: string;
    expansionId?: string;
    stockState?: string;
  };
}) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const t = await getTranslations({ locale: params.locale, namespace: "adminInventory" });
  const tSeo = await getTranslations({ locale: params.locale, namespace: "seo.breadcrumb" });
  const tAdmin = await getTranslations({ locale: params.locale, namespace: "adminDashboard" });

  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const pageSize = Number(searchParams?.pageSize ?? 20) || 20;
  const query = searchParams?.query?.trim() ?? "";
  const scopeType: InventoryScopeType = searchParams?.scopeType === "BRANCH" ? "BRANCH" : "ONLINE_STORE";
  const branchIdParam = searchParams?.branchId?.trim() || "";
  const stockState = searchParams?.stockState ?? "ALL";
  const gameId = searchParams?.gameId?.trim() || "ALL";
  const categoryId = searchParams?.categoryId?.trim() || "ALL";
  const expansionId = searchParams?.expansionId?.trim() || "ALL";
  const direction = searchParams?.direction === "asc" ? "asc" : "desc";
  const sort = searchParams?.sort ?? "updatedAt";

  const [branches, games, categories, expansions] = await Promise.all([
    fetchAdminBranches(),
    fetchTaxonomies({ type: "GAME", page: 1, pageSize: 100 }),
    fetchTaxonomies({ type: "CATEGORY", page: 1, pageSize: 100 }),
    fetchTaxonomies({ type: "EXPANSION", page: 1, pageSize: 100 })
  ]);

  const selectedBranchId = scopeType === "BRANCH" ? (branchIdParam || branches[0]?.id || "") : "";
  const canLoadInventory = scopeType === "ONLINE_STORE" || Boolean(selectedBranchId);
  const inventory = canLoadInventory
    ? await fetchInventory({
        page,
        pageSize,
        query,
        sort,
        direction,
        scopeType,
        branchId: selectedBranchId || null
      })
    : { items: [], page, pageSize, total: 0, hasMore: false };

  const filteredItems = inventory.items.filter((item) => {
    if (gameId !== "ALL" && item.gameId !== gameId) {
      return false;
    }
    if (categoryId !== "ALL" && item.categoryId !== categoryId) {
      return false;
    }
    if (expansionId !== "ALL" && item.expansionId !== expansionId) {
      return false;
    }
    if (stockState !== "ALL") {
      const available = item.available ?? 0;
      const reserved = item.reserved ?? 0;
      const total = item.total ?? available + reserved;
      const state = getStockState(total);
      if (stockState === "AVAILABLE" && state !== "AVAILABLE") {
        return false;
      }
      if (stockState === "LOW_STOCK" && state !== "LOW_STOCK") {
        return false;
      }
      if (stockState === "SOLD_OUT" && state !== "SOLD_OUT") {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        locale={params.locale}
        homeLabel={tSeo("home")}
        adminLabel={tAdmin("title")}
        items={[{ label: t("title") }]}
      />

      <InventoryListScreen
        locale={params.locale}
        title={t("title")}
        subtitle={t("subtitle")}
        branches={branches.map((branch) => ({ id: branch.id, name: branch.name }))}
        games={games.items.map((taxonomy) => ({ id: taxonomy.id, name: taxonomy.name }))}
        categories={categories.items.map((taxonomy) => ({ id: taxonomy.id, name: taxonomy.name }))}
        expansions={expansions.items.map((taxonomy) => ({ id: taxonomy.id, name: taxonomy.name }))}
        items={filteredItems}
        initialFilters={{
          scopeType,
          branchId: selectedBranchId,
          query,
          gameId,
          categoryId,
          expansionId,
          stockState
        }}
        labels={{
          product: t("columns.product"),
          sku: t("columns.sku"),
          available: t("columns.available"),
          reserved: t("columns.reserved"),
          total: t("columns.total"),
          state: t("columns.state"),
          adjust: t("columns.adjust"),
          action: t("columns.action"),
          noGame: t("labels.noGame"),
          empty: t("empty"),
          apply: t("filters.apply"),
          reset: t("filters.reset"),
          exportCsv: t("actions.exportCsv"),
          bulkAdjust: t("actions.bulkAdjust"),
          view: t("actions.view"),
          reason: t("actions.reason"),
          scope: t("filters.scope"),
          onlineStore: t("filters.onlineStore"),
          branch: t("filters.branch"),
          branchLabel: t("filters.branchLabel"),
          game: t("filters.game"),
          allGames: t("filters.allGames"),
          category: t("filters.category"),
          allCategories: t("filters.allCategories"),
          expansion: t("filters.expansion"),
          allExpansions: t("filters.allExpansions"),
          stockState: t("filters.stockState"),
          allStockStates: t("filters.allStockStates"),
          search: t("filters.search"),
          searchPlaceholder: t("filters.searchPlaceholder"),
          availableState: t("status.available"),
          lowStockState: t("status.lowStock"),
          soldOutState: t("status.soldOut"),
          confirmTitle: t("confirm.title"),
          confirmDescription: t("confirm.description", { count: "{count}" }),
          confirmContinue: t("confirm.continue"),
          confirmCancel: t("confirm.cancel"),
          invalidToast: t("confirm.invalid")
        }}
      />
    </div>
  );
}
