import type { InventoryRepository } from "../ports";

export type InventoryUseCases = {
  listInventory: (params: {
    page: number;
    pageSize: number;
    query?: string;
    sort?: "updatedAt" | "available" | "name";
    direction?: "asc" | "desc";
    scopeType?: "ONLINE_STORE" | "BRANCH";
    branchId?: string | null;
  }) => Promise<{ items: Array<Record<string, unknown>>; total: number }>;
  adjustInventory: (params: {
    productId: string;
    delta: number;
    reason: string;
    actorUserId: string;
    scopeType?: "ONLINE_STORE" | "BRANCH";
    branchId?: string | null;
    idempotencyKey?: string | null;
  }) => Promise<{ item: Record<string, unknown>; adjustment: Record<string, unknown> } | null>;
  createMovement: (params: {
    productId: string;
    scopeType: "ONLINE_STORE" | "BRANCH";
    branchId: string | null;
    delta: number;
    reason: string;
    actorRole: "ADMIN" | "EMPLOYEE" | "TERMINAL";
    actorUserId?: string | null;
    actorTerminalId?: string | null;
    idempotencyKey: string;
  }) => Promise<{ item: Record<string, unknown>; adjustment: Record<string, unknown> } | null>;
  getInventoryStockDetail: (params: {
    productId: string;
  }) => Promise<Record<string, unknown> | null>;
  listInventoryMovements: (params: {
    page: number;
    pageSize: number;
    productId?: string;
    branchId?: string | null;
    scopeType?: "ONLINE_STORE" | "BRANCH";
    direction?: "asc" | "desc";
    from?: string | null;
    to?: string | null;
  }) => Promise<{ items: Array<Record<string, unknown>>; total: number }>;
};

export function createInventoryUseCases(deps: { inventoryRepository: InventoryRepository }): InventoryUseCases {
  return {
    listInventory: (params) => deps.inventoryRepository.listInventory(params),
    adjustInventory: (params) => deps.inventoryRepository.adjustInventory(params),
    createMovement: (params) => deps.inventoryRepository.createMovement(params),
    getInventoryStockDetail: (params) => deps.inventoryRepository.getInventoryStockDetail(params),
    listInventoryMovements: (params) => deps.inventoryRepository.listInventoryMovements(params)
  };
}
