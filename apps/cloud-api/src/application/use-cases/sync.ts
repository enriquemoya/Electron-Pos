import type { SyncRepository } from "../ports";

export type SyncUseCases = {
  recordEvents: (events: any[]) => Promise<{ accepted: string[]; duplicates: string[] }>;
  getPendingEvents: (posId: string, since: string | null) => Promise<any[]>;
  acknowledgeEvents: (posId: string, eventIds: string[]) => Promise<void>;
  createOrder: (orderId: string, items: any[], branchId: string) => Promise<{ duplicate: boolean }>;
  getCatalogSnapshot: (params: {
    branchId: string;
    page: number;
    pageSize: number;
  }) => Promise<{ items: any[]; total: number; snapshotVersion: string; appliedAt: string }>;
  getCatalogDelta: (params: {
    branchId: string;
    since: string | null;
    page: number;
    pageSize: number;
  }) => Promise<{ items: any[]; total: number; snapshotVersion: string; appliedAt: string }>;
  reconcileCatalog: (params: {
    branchId: string;
    manifest: Array<{
      entityType: string;
      cloudId: string;
      localId: string | null;
      updatedAt: string | null;
      versionHash: string | null;
    }>;
  }) => Promise<{ missing: any[]; stale: any[]; unknown: any[]; snapshotVersion: string }>;
  ingestSalesEvent: (params: {
    terminalId: string;
    branchId: string;
    localEventId: string;
    eventType: string;
    payload: Record<string, unknown>;
  }) => Promise<{ duplicate: boolean }>;
  readProducts: (params: {
    page: number;
    pageSize: number;
    id: string | null;
    gameId?: string | "misc" | null;
    categoryId?: string | null;
    expansionId?: string | null;
    priceMin?: number | null;
    priceMax?: number | null;
  }) => Promise<{ items: any[]; total: number }>;
};

export function createSyncUseCases(deps: { syncRepository: SyncRepository }): SyncUseCases {
  return {
    recordEvents: (events) => deps.syncRepository.recordEvents(events),
    getPendingEvents: (posId, since) => deps.syncRepository.getPendingEvents(posId, since),
    acknowledgeEvents: (posId, eventIds) => deps.syncRepository.acknowledgeEvents(posId, eventIds),
    createOrder: (orderId, items, branchId) => deps.syncRepository.createOrder(orderId, items, branchId),
    getCatalogSnapshot: (params) => deps.syncRepository.getCatalogSnapshot(params),
    getCatalogDelta: (params) => deps.syncRepository.getCatalogDelta(params),
    reconcileCatalog: (params) => deps.syncRepository.reconcileCatalog(params),
    ingestSalesEvent: (params) => deps.syncRepository.ingestSalesEvent(params),
    readProducts: (params) => deps.syncRepository.readProducts(params)
  };
}
