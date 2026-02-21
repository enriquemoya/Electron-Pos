import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { InventoryBranchStockTable } from "@/components/admin/inventory-branch-stock-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchInventoryMovements, fetchInventoryStockDetail } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/admin-guard";

type DetailTab = "branches" | "movements" | "settings";

function getStockState(total: number): "AVAILABLE" | "LOW_STOCK" | "SOLD_OUT" {
  if (total <= 0) {
    return "SOLD_OUT";
  }
  if (total < 5) {
    return "LOW_STOCK";
  }
  return "AVAILABLE";
}

export default async function InventoryDetailPage({
  params,
  searchParams
}: {
  params: { locale: string; productId: string };
  searchParams?: {
    toast?: string;
    tab?: string;
    movementBranchId?: string;
    movementType?: string;
    from?: string;
    to?: string;
    direction?: string;
  };
}) {
  setRequestLocale(params.locale);
  requireAdmin(params.locale);

  const t = await getTranslations({ locale: params.locale, namespace: "adminInventory" });
  const tSeo = await getTranslations({ locale: params.locale, namespace: "seo.breadcrumb" });
  const tAdmin = await getTranslations({ locale: params.locale, namespace: "adminDashboard" });

  const detail = await fetchInventoryStockDetail(params.productId);
  const tab: DetailTab = searchParams?.tab === "movements" || searchParams?.tab === "settings"
    ? searchParams.tab
    : "branches";
  const movementBranchId = searchParams?.movementBranchId?.trim() || "ALL";
  const movementType = searchParams?.movementType?.trim() || "ALL";
  const direction = searchParams?.direction === "asc" ? "asc" : "desc";
  const from = searchParams?.from || "";
  const to = searchParams?.to || "";

  const movementScopeType = movementBranchId === "online" ? "ONLINE_STORE" : undefined;
  const movementBranchFilter =
    movementBranchId === "ALL" || movementBranchId === "online" ? undefined : movementBranchId;

  const movements = await fetchInventoryMovements({
    page: 1,
    pageSize: 50,
    productId: params.productId,
    branchId: movementBranchFilter,
    scopeType: movementScopeType,
    direction,
    from: from || undefined,
    to: to || undefined
  });

  const filteredMovements = movements.items.filter((item) => {
    if (movementType !== "ALL" && item.movementType !== movementType) {
      return false;
    }
    return true;
  });

  const branchRows = [
    {
      branchId: "online",
      branchName: t("branches.digitalStore"),
      branchCity: null,
      available: detail.summary.onlineStoreQuantity,
      reserved: 0,
      total: detail.summary.onlineStoreQuantity,
      scopeType: "ONLINE_STORE" as const
    },
    ...detail.branches.map((branch) => ({
      branchId: branch.branchId,
      branchName: branch.branchName,
      branchCity: branch.branchCity,
      available: branch.available,
      reserved: branch.reserved,
      total: branch.total,
      scopeType: "BRANCH" as const
    }))
  ];

  const returnBase = `/${params.locale}/admin/inventory/${params.productId}`;

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        locale={params.locale}
        homeLabel={tSeo("home")}
        adminLabel={tAdmin("title")}
        items={[
          { label: t("title"), href: `/${params.locale}/admin/inventory` },
          { label: t("detail.title") }
        ]}
      />

      <Card className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-white/10 bg-base-900">
              {detail.product.imageUrl ? (
                <Image
                  src={detail.product.imageUrl}
                  alt={detail.product.displayName ?? detail.product.productId}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : null}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-white">{detail.product.displayName ?? detail.product.productId}</h1>
              <div className="text-sm text-white/60">{detail.product.game ?? t("labels.noGame")}</div>
              <div className="text-sm text-white/40">{detail.product.slug ?? "--"}</div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-base-900 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">{t("detail.globalStock")}</div>
              <div className="text-3xl font-semibold text-white">{detail.summary.globalQuantity}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-base-900 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">{t("detail.lowStockThreshold")}</div>
              <div className="text-3xl font-semibold text-white">{detail.summary.lowStockThreshold}</div>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="branches">{t("detail.tabs.branches")}</TabsTrigger>
          <TabsTrigger value="movements">{t("detail.tabs.movements")}</TabsTrigger>
          <TabsTrigger value="settings">{t("detail.tabs.settings")}</TabsTrigger>
        </TabsList>

        <TabsContent value="branches">
          <Card className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <InventoryBranchStockTable
              productId={detail.product.productId}
              rows={branchRows}
              labels={{
                branch: t("detail.stockTable.branch"),
                available: t("columns.available"),
                reserved: t("columns.reserved"),
                total: t("columns.total"),
                state: t("columns.state"),
                adjust: t("columns.adjust"),
                reason: t("actions.reason"),
                apply: t("filters.apply"),
                bulkAdjust: t("actions.bulkAdjust"),
                soldOutState: t("status.soldOut"),
                lowStockState: t("status.lowStock"),
                availableState: t("status.available"),
                digitalScope: t("labels.digitalScope"),
                confirmTitle: t("confirm.title"),
                confirmDescription: t("confirm.description", { count: "{count}" }),
                confirmContinue: t("confirm.continue"),
                confirmCancel: t("confirm.cancel"),
                invalidToast: t("confirm.invalid")
              }}
            />
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <form method="get" className="grid gap-3 lg:grid-cols-5">
              <input type="hidden" name="tab" value="movements" />
              <div className="space-y-1">
                <Label htmlFor="movementBranchId">{t("detail.movementFilters.branch")}</Label>
                <Select name="movementBranchId" defaultValue={movementBranchId}>
                  <SelectTrigger id="movementBranchId">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t("detail.movementFilters.allBranches")}</SelectItem>
                    <SelectItem value="online">{t("branches.digitalStore")}</SelectItem>
                    {detail.branches.map((branch) => (
                      <SelectItem key={branch.branchId} value={branch.branchId}>
                        {branch.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="movementType">{t("detail.movementFilters.type")}</Label>
                <Select name="movementType" defaultValue={movementType}>
                  <SelectTrigger id="movementType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t("detail.movementFilters.allTypes")}</SelectItem>
                    <SelectItem value="MANUAL">{t("detail.movementType.manual")}</SelectItem>
                    <SelectItem value="ORDER">{t("detail.movementType.order")}</SelectItem>
                    <SelectItem value="TRANSFER">{t("detail.movementType.transfer")}</SelectItem>
                    <SelectItem value="CORRECTION">{t("detail.movementType.correction")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="from">{t("detail.movementFilters.from")}</Label>
                <Input id="from" name="from" type="date" defaultValue={from} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="to">{t("detail.movementFilters.to")}</Label>
                <Input id="to" name="to" type="date" defaultValue={to} />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" className="h-10 flex-1 bg-accent-500 text-base-950 hover:bg-accent-500/90">
                  {t("filters.apply")}
                </Button>
                <Button asChild type="button" variant="outline" className="h-10 border-white/10 text-white">
                  <Link href={`${returnBase}?tab=movements`}>
                    {t("filters.reset")}
                  </Link>
                </Button>
              </div>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("detail.movementTable.date")}</TableHead>
                  <TableHead>{t("detail.movementTable.branch")}</TableHead>
                  <TableHead>{t("detail.movementTable.user")}</TableHead>
                  <TableHead>{t("detail.movementTable.role")}</TableHead>
                  <TableHead>{t("detail.movementTable.type")}</TableHead>
                  <TableHead className="text-right">{t("detail.movementTable.delta")}</TableHead>
                  <TableHead className="text-right">{t("detail.movementTable.before")}</TableHead>
                  <TableHead className="text-right">{t("detail.movementTable.after")}</TableHead>
                  <TableHead>{t("detail.movementTable.reason")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-white/60">
                      {t("detail.movementTable.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>{new Date(movement.createdAt).toLocaleString(params.locale)}</TableCell>
                      <TableCell>{movement.branchName ?? t("branches.digitalStore")}</TableCell>
                      <TableCell>{movement.actorDisplayName}</TableCell>
                      <TableCell>{movement.actorRole}</TableCell>
                      <TableCell>{t(`detail.movementType.${movement.movementType.toLowerCase()}`)}</TableCell>
                      <TableCell className={`text-right font-semibold ${movement.delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                        {movement.delta > 0 ? `+${movement.delta}` : movement.delta}
                      </TableCell>
                      <TableCell className="text-right">{movement.previousQuantity}</TableCell>
                      <TableCell className="text-right">{movement.newQuantity}</TableCell>
                      <TableCell>{movement.reason}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">{t("detail.settings.title")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="lowStock">{t("detail.lowStockThreshold")}</Label>
                <Input id="lowStock" type="number" defaultValue={String(detail.summary.lowStockThreshold)} disabled />
              </div>
              <div className="space-y-1">
                <Label htmlFor="updatedAt">{t("detail.settings.lastUpdate")}</Label>
                <Input id="updatedAt" value={new Date(detail.product.updatedAt).toLocaleString(params.locale)} disabled />
              </div>
            </div>
            <p className="text-sm text-white/50">{t("detail.settings.notice")}</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
