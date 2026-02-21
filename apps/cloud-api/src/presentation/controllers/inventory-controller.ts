import type { Request, Response } from "express";
import { randomUUID } from "crypto";

import { ApiErrors, asApiError } from "../../errors/api-error";
import { appLogger } from "../../config/app-logger";
import type { InventoryUseCases } from "../../application/use-cases/inventory";
import { isIsoString, isPositiveNumber, parsePage } from "../../validation/common";
import { validateInventoryAdjustment, validateInventoryMovementPayload } from "../../validation/inventory";

type AuthRequest = Request & {
  auth?: { userId: string; role: string };
  terminal?: { terminalId: string; branchId: string };
  posUser?: { userId: string; role: "ADMIN" | "EMPLOYEE" };
};

function parseScope(body: unknown) {
  const scopeType = String((body as { scopeType?: unknown })?.scopeType ?? "ONLINE_STORE").toUpperCase();
  const branchIdRaw = (body as { branchId?: unknown })?.branchId;
  const branchId = branchIdRaw == null || branchIdRaw === "" ? null : String(branchIdRaw);

  if (scopeType !== "ONLINE_STORE" && scopeType !== "BRANCH") {
    throw ApiErrors.inventoryScopeInvalid;
  }

  if (scopeType === "ONLINE_STORE" && branchId) {
    throw ApiErrors.inventoryScopeInvalid;
  }

  if (scopeType === "BRANCH" && !branchId) {
    throw ApiErrors.inventoryBranchRequired;
  }

  return {
    scopeType: scopeType as "ONLINE_STORE" | "BRANCH",
    branchId
  };
}

export function createInventoryController(useCases: InventoryUseCases) {
  const handleListInventory = async (req: Request, res: Response) => {
    const page = parsePage(req.query.page, 1);
    const pageSize = parsePage(req.query.pageSize, 25);
    const query = typeof req.query.query === "string" ? req.query.query : undefined;
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
    const direction = req.query.direction === "asc" ? "asc" : "desc";
    const allowedSizes = new Set([20, 25, 50, 100]);
    const scopeType = req.query.scopeType === "BRANCH" ? "BRANCH" : "ONLINE_STORE";
    const branchId = typeof req.query.branchId === "string" && req.query.branchId.trim() ? String(req.query.branchId) : null;

    if (!isPositiveNumber(page) || !isPositiveNumber(pageSize) || !allowedSizes.has(pageSize)) {
      res.status(ApiErrors.adminPaginationInvalid.status).json({ error: ApiErrors.adminPaginationInvalid.message, code: ApiErrors.adminPaginationInvalid.code });
      return;
    }

    if ((scopeType === "ONLINE_STORE" && branchId) || (scopeType === "BRANCH" && !branchId)) {
      res.status(ApiErrors.inventoryScopeInvalid.status).json({
        error: ApiErrors.inventoryScopeInvalid.message,
        code: ApiErrors.inventoryScopeInvalid.code
      });
      return;
    }

    try {
      const result = await useCases.listInventory({
        page,
        pageSize,
        query,
        sort: sort === "available" || sort === "name" ? sort : "updatedAt",
        direction,
        scopeType,
        branchId
      });
      res.status(200).json({
        items: result.items,
        page,
        pageSize,
        total: result.total,
        hasMore: page * pageSize < result.total
      });
    } catch (error) {
      appLogger.error("inventory stock list failed", {
        code: (error as { code?: string })?.code ?? null,
        message: error instanceof Error ? error.message : "unknown error",
        stack: error instanceof Error ? error.stack : null,
        page,
        pageSize,
        scopeType,
        branchId
      });
      const apiError = asApiError(error, ApiErrors.inventoryStockReadFailed);
      res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
    }
  };

  return {
    async listInventoryHandler(req: Request, res: Response) {
      return handleListInventory(req, res);
    },

    async listInventoryStockHandler(req: Request, res: Response) {
      return handleListInventory(req, res);
    },

    async adjustInventoryHandler(req: Request, res: Response) {
      const productId = String(req.params.productId || "");
      const actorUserId = (req as AuthRequest).auth?.userId;

      if (!actorUserId) {
        res.status(ApiErrors.unauthorized.status).json({ error: ApiErrors.unauthorized.message, code: ApiErrors.unauthorized.code });
        return;
      }

      try {
        const payload = validateInventoryAdjustment(req.body ?? {});
        const result = await useCases.adjustInventory({
          productId,
          delta: payload.delta,
          reason: payload.reason,
          actorUserId,
          scopeType: "ONLINE_STORE",
          branchId: null
        });

        if (!result) {
          res.status(ApiErrors.inventoryNotFound.status).json({ error: ApiErrors.inventoryNotFound.message, code: ApiErrors.inventoryNotFound.code });
          return;
        }

        res.status(200).json({ item: result.item, adjustment: result.adjustment });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.inventoryInvalid);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },

    async createAdminMovementHandler(req: Request, res: Response) {
      const actor = (req as AuthRequest).auth;
      if (!actor?.userId || actor.role !== "ADMIN") {
        res.status(ApiErrors.rbacForbidden.status).json({ error: ApiErrors.rbacForbidden.message, code: ApiErrors.rbacForbidden.code });
        return;
      }

      try {
        const payload = validateInventoryMovementPayload(req.body ?? {}, { requireIdempotency: false });
        const scope = parseScope(req.body ?? {});

        const result = await useCases.createMovement({
          productId: payload.productId,
          scopeType: scope.scopeType,
          branchId: scope.branchId,
          delta: payload.delta,
          reason: payload.reason,
          actorRole: "ADMIN",
          actorUserId: actor.userId,
          idempotencyKey: payload.idempotencyKey || randomUUID()
        });

        if (!result) {
          res.status(ApiErrors.inventoryNotFound.status).json({ error: ApiErrors.inventoryNotFound.message, code: ApiErrors.inventoryNotFound.code });
          return;
        }

        res.status(200).json({ item: result.item, adjustment: result.adjustment });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.inventoryInvalid);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },

    async createPosMovementHandler(req: Request, res: Response) {
      const terminal = (req as AuthRequest).terminal;
      if (!terminal?.terminalId || !terminal.branchId) {
        res.status(ApiErrors.terminalInvalidToken.status).json({
          error: ApiErrors.terminalInvalidToken.message,
          code: ApiErrors.terminalInvalidToken.code
        });
        return;
      }

      try {
        const payload = validateInventoryMovementPayload(req.body ?? {});
        if (payload.delta < 0) {
          throw ApiErrors.rbacForbidden;
        }

        const result = await useCases.createMovement({
          productId: payload.productId,
          scopeType: "BRANCH",
          branchId: terminal.branchId,
          delta: payload.delta,
          reason: payload.reason,
          actorRole: "TERMINAL",
          actorTerminalId: terminal.terminalId,
          idempotencyKey: payload.idempotencyKey
        });

        if (!result) {
          res.status(ApiErrors.inventoryNotFound.status).json({ error: ApiErrors.inventoryNotFound.message, code: ApiErrors.inventoryNotFound.code });
          return;
        }

        res.status(200).json({ item: result.item, adjustment: result.adjustment });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.inventoryInvalid);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },

    async createPosAdminMovementHandler(req: Request, res: Response) {
      const terminal = (req as AuthRequest).terminal;
      const posUser = (req as AuthRequest).posUser;
      if (!terminal?.terminalId || !terminal.branchId) {
        res.status(ApiErrors.terminalInvalidToken.status).json({
          error: ApiErrors.terminalInvalidToken.message,
          code: ApiErrors.terminalInvalidToken.code
        });
        return;
      }

      if (!posUser || posUser.role !== "ADMIN") {
        res.status(ApiErrors.rbacForbidden.status).json({ error: ApiErrors.rbacForbidden.message, code: ApiErrors.rbacForbidden.code });
        return;
      }

      try {
        const payload = validateInventoryMovementPayload(req.body ?? {});

        const result = await useCases.createMovement({
          productId: payload.productId,
          scopeType: "BRANCH",
          branchId: terminal.branchId,
          delta: payload.delta,
          reason: payload.reason,
          actorRole: "ADMIN",
          actorUserId: posUser.userId,
          actorTerminalId: terminal.terminalId,
          idempotencyKey: payload.idempotencyKey
        });

        if (!result) {
          res.status(ApiErrors.inventoryNotFound.status).json({ error: ApiErrors.inventoryNotFound.message, code: ApiErrors.inventoryNotFound.code });
          return;
        }

        res.status(200).json({ item: result.item, adjustment: result.adjustment });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.inventoryInvalid);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },

    async getInventoryStockDetailHandler(req: Request, res: Response) {
      const productId = String(req.params.productId || "").trim();
      if (!productId) {
        res.status(ApiErrors.inventoryInvalid.status).json({ error: ApiErrors.inventoryInvalid.message, code: ApiErrors.inventoryInvalid.code });
        return;
      }

      try {
        const detail = await useCases.getInventoryStockDetail({ productId });
        if (!detail) {
          res.status(ApiErrors.inventoryNotFound.status).json({
            error: ApiErrors.inventoryNotFound.message,
            code: ApiErrors.inventoryNotFound.code
          });
          return;
        }
        res.status(200).json(detail);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.inventoryStockReadFailed);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },

    async listInventoryMovementsHandler(req: Request, res: Response) {
      const page = parsePage(req.query.page, 1);
      const pageSize = parsePage(req.query.pageSize, 20);
      const productId = typeof req.query.productId === "string" ? req.query.productId.trim() : undefined;
      const branchId = typeof req.query.branchId === "string" && req.query.branchId.trim() ? req.query.branchId.trim() : null;
      const scopeType = req.query.scopeType === "BRANCH" ? "BRANCH" : req.query.scopeType === "ONLINE_STORE" ? "ONLINE_STORE" : undefined;
      const direction = req.query.direction === "asc" ? "asc" : "desc";
      const from = typeof req.query.from === "string" && isIsoString(req.query.from) ? req.query.from : null;
      const to = typeof req.query.to === "string" && isIsoString(req.query.to) ? req.query.to : null;

      if (!isPositiveNumber(page) || !isPositiveNumber(pageSize)) {
        res.status(ApiErrors.adminPaginationInvalid.status).json({ error: ApiErrors.adminPaginationInvalid.message, code: ApiErrors.adminPaginationInvalid.code });
        return;
      }

      try {
        const result = await useCases.listInventoryMovements({
          page,
          pageSize,
          productId,
          branchId,
          scopeType,
          direction,
          from,
          to
        });

        res.status(200).json({
          items: result.items,
          page,
          pageSize,
          total: result.total,
          hasMore: page * pageSize < result.total
        });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.inventoryStockReadFailed);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    }
  };
}
