import type { Request, Response } from "express";

import { ApiErrors, asApiError } from "../../errors/api-error";
import type { SyncUseCases } from "../../application/use-cases/sync";
import { isPositiveNumber, isUuid, parsePage } from "../../validation/common";

function parseNullableNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function createSyncController(useCases: SyncUseCases) {
  const parseSyncRequestContext = (req: Request) => {
    const terminal = (req as Request & { terminal?: { terminalId: string; branchId: string } }).terminal;
    if (!terminal?.terminalId || !terminal?.branchId) {
      throw ApiErrors.posSyncUnauthorized;
    }
    return terminal;
  };

  return {
    async recordEventsHandler(req: Request, res: Response) {
      const events = Array.isArray(req.body?.events) ? req.body.events : [];
      if (events.length === 0) {
        res.status(400).json({ error: ApiErrors.eventsRequired.message });
        return;
      }

      try {
        const result = await useCases.recordEvents(events);
        res.status(200).json(result);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.invalidRequest);
        res.status(apiError.status).json({ error: apiError.message });
      }
    },
    async getPendingHandler(req: Request, res: Response) {
      const posId = String(req.query.posId || "");
      const since = req.query.since ? String(req.query.since) : null;
      if (!posId) {
        res.status(400).json({ error: ApiErrors.posIdRequired.message });
        return;
      }

      try {
        const events = await useCases.getPendingEvents(posId, since);
        res.status(200).json({ events });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.serverError);
        res.status(apiError.status).json({ error: apiError.message });
      }
    },
    async acknowledgeHandler(req: Request, res: Response) {
      const posId = req.body?.posId;
      const eventIds = Array.isArray(req.body?.eventIds) ? req.body.eventIds : [];
      if (!posId || eventIds.length === 0) {
        res.status(400).json({ error: ApiErrors.posAckRequired.message });
        return;
      }

      try {
        await useCases.acknowledgeEvents(posId, eventIds);
        res.status(200).json({ acknowledged: eventIds });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.serverError);
        res.status(apiError.status).json({ error: apiError.message });
      }
    },
    async createOrderHandler(req: Request, res: Response) {
      const orderId = req.body?.orderId;
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      const terminal = (req as Request & { terminal?: { branchId: string } }).terminal;
      if (!orderId || items.length === 0) {
        res.status(400).json({ error: ApiErrors.orderRequired.message });
        return;
      }
      if (!terminal?.branchId) {
        res.status(ApiErrors.terminalInvalidToken.status).json({
          error: ApiErrors.terminalInvalidToken.message,
          code: ApiErrors.terminalInvalidToken.code
        });
        return;
      }

      try {
        const result = await useCases.createOrder(String(orderId), items, terminal.branchId);
        if (result.duplicate) {
          res.status(200).json({ status: "duplicate" });
        } else {
          res.status(201).json({ status: "created" });
        }
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.serverError);
        res.status(apiError.status).json({ error: apiError.message });
      }
    },
    async readProductsHandler(req: Request, res: Response) {
      const page = parsePage(req.query.page, 1);
      const pageSize = parsePage(req.query.pageSize, 24);
      const id = req.query.id ? String(req.query.id) : null;
      const gameId = req.query.gameId ? String(req.query.gameId) : null;
      const categoryId = req.query.categoryId ? String(req.query.categoryId) : null;
      const expansionId = req.query.expansionId ? String(req.query.expansionId) : null;
      const priceMin = parseNullableNumber(req.query.priceMin);
      const priceMax = parseNullableNumber(req.query.priceMax);

      if (!isPositiveNumber(page) || !isPositiveNumber(pageSize)) {
        res.status(400).json({ error: ApiErrors.invalidPagination.message });
        return;
      }
      if (id && !isUuid(id)) {
        res.status(ApiErrors.catalogFiltersInvalid.status).json({ error: ApiErrors.catalogFiltersInvalid.message });
        return;
      }
      if (gameId && gameId !== "misc" && !isUuid(gameId)) {
        res.status(ApiErrors.catalogFiltersInvalid.status).json({ error: ApiErrors.catalogFiltersInvalid.message });
        return;
      }
      if (categoryId && !isUuid(categoryId)) {
        res.status(ApiErrors.catalogFiltersInvalid.status).json({ error: ApiErrors.catalogFiltersInvalid.message });
        return;
      }
      if (expansionId && !isUuid(expansionId)) {
        res.status(ApiErrors.catalogFiltersInvalid.status).json({ error: ApiErrors.catalogFiltersInvalid.message });
        return;
      }
      if ((priceMin !== null && (!Number.isFinite(priceMin) || priceMin < 0)) || (priceMax !== null && (!Number.isFinite(priceMax) || priceMax < 0))) {
        res.status(ApiErrors.catalogFiltersInvalid.status).json({ error: ApiErrors.catalogFiltersInvalid.message });
        return;
      }
      if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
        res.status(ApiErrors.catalogFiltersInvalid.status).json({ error: ApiErrors.catalogFiltersInvalid.message });
        return;
      }

      try {
        const result = await useCases.readProducts({
          page,
          pageSize,
          id,
          gameId,
          categoryId,
          expansionId,
          priceMin,
          priceMax
        });
        res.status(200).json({
          items: result.items,
          page,
          pageSize,
          total: result.total,
          hasMore: page * pageSize < result.total
        });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.serverError);
        res.status(apiError.status).json({ error: apiError.message });
      }
    },
    async catalogSnapshotHandler(req: Request, res: Response) {
      try {
        const terminal = parseSyncRequestContext(req);
        const page = parsePage(req.query.page, 1);
        const pageSize = Math.max(1, Math.min(200, parsePage(req.query.pageSize, 200)));
        if (!isPositiveNumber(page) || !isPositiveNumber(pageSize)) {
          throw ApiErrors.invalidPagination;
        }
        const result = await useCases.getCatalogSnapshot({
          branchId: terminal.branchId,
          page,
          pageSize
        });
        res.status(200).json(result);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.posCatalogSnapshotFailed);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },
    async catalogDeltaHandler(req: Request, res: Response) {
      try {
        const terminal = parseSyncRequestContext(req);
        const page = parsePage(req.query.page, 1);
        const pageSize = Math.max(1, Math.min(200, parsePage(req.query.pageSize, 200)));
        const since = req.query.since ? String(req.query.since) : null;
        if (!isPositiveNumber(page) || !isPositiveNumber(pageSize)) {
          throw ApiErrors.invalidPagination;
        }
        const result = await useCases.getCatalogDelta({
          branchId: terminal.branchId,
          since,
          page,
          pageSize
        });
        res.status(200).json(result);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.posCatalogDeltaFailed);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },
    async reconcileCatalogHandler(req: Request, res: Response) {
      try {
        const terminal = parseSyncRequestContext(req);
        const manifest = Array.isArray(req.body?.catalogManifest) ? req.body.catalogManifest : [];
        if (manifest.length > 5000) {
          throw ApiErrors.posCatalogManifestTooLarge;
        }
        const normalized = manifest.map((entry: Record<string, unknown>) => ({
          entityType: String(entry.entityType || ""),
          cloudId: String(entry.cloudId || ""),
          localId: entry.localId == null ? null : String(entry.localId),
          updatedAt: entry.updatedAt == null ? null : String(entry.updatedAt),
          versionHash: entry.versionHash == null ? null : String(entry.versionHash)
        }));
        const result = await useCases.reconcileCatalog({
          branchId: terminal.branchId,
          manifest: normalized
        });
        res.status(200).json(result);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.posCatalogReconcileFailed);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },
    async ingestSalesEventHandler(req: Request, res: Response) {
      try {
        const terminal = parseSyncRequestContext(req);
        const localEventId = String(req.body?.localEventId || "");
        const eventType = String(req.body?.eventType || "");
        const payload = (req.body?.payload && typeof req.body.payload === "object")
          ? (req.body.payload as Record<string, unknown>)
          : null;

        if (!localEventId || !eventType || !payload) {
          throw ApiErrors.posSyncEventInvalid;
        }
        if (payload.branchId && String(payload.branchId) !== terminal.branchId) {
          throw ApiErrors.posSyncEventInvalid;
        }

        const result = await useCases.ingestSalesEvent({
          terminalId: terminal.terminalId,
          branchId: terminal.branchId,
          localEventId,
          eventType,
          payload
        });

        if (result.duplicate) {
          res.status(200).json({
            status: "duplicate",
            code: ApiErrors.posSyncEventDuplicate.code
          });
          return;
        }

        res.status(201).json({ status: "synced" });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.posSyncStorageFailed);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    }
  };
}
