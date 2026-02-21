import type { Request, Response } from "express";

import { ApiErrors, asApiError } from "../../errors/api-error";
import type { OrderFulfillmentUseCases } from "../../application/use-cases/order-fulfillment";
import { validateOrderListQuery, validateRefundBody, validateTransitionBody } from "../../validation/order-fulfillment";

type AuthRequest = Request & {
  auth?: { userId: string; role: string; branchId?: string | null; displayName?: string | null };
};

export function createOrderFulfillmentController(useCases: OrderFulfillmentUseCases) {
  return {
    async listAdminOrdersHandler(req: Request, res: Response) {
      try {
        const query = validateOrderListQuery(req.query as Record<string, unknown>);
        const result = await useCases.listAdminOrders({
          page: query.page,
          pageSize: query.pageSize,
          actorRole: (req as AuthRequest).auth?.role,
          actorBranchId: (req as AuthRequest).auth?.branchId ?? null,
          query: query.query,
          status: query.status,
          sort: query.sort,
          direction: query.direction
        });
        res.status(200).json({
          items: result.items,
          page: query.page,
          pageSize: query.pageSize,
          total: result.total,
          hasMore: query.page * query.pageSize < result.total
        });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.serverError);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },
    async getAdminOrderHandler(req: Request, res: Response) {
      try {
        const orderId = String(req.params.orderId || "").trim();
        if (!orderId) {
          res.status(ApiErrors.invalidRequest.status).json({ error: ApiErrors.invalidRequest.message, code: ApiErrors.invalidRequest.code });
          return;
        }

        const auth = (req as AuthRequest).auth;
        const order = await useCases.getAdminOrder({
          orderId,
          actorRole: auth?.role,
          actorBranchId: auth?.branchId ?? null
        });
        if (!order) {
          res.status(ApiErrors.checkoutOrderNotFound.status).json({ error: ApiErrors.checkoutOrderNotFound.message, code: ApiErrors.checkoutOrderNotFound.code });
          return;
        }

        res.status(200).json({ order });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.serverError);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },
    async transitionOrderStatusHandler(req: Request, res: Response) {
      const auth = (req as AuthRequest).auth;
      if (!auth) {
        res.status(ApiErrors.unauthorized.status).json({ error: ApiErrors.unauthorized.message, code: ApiErrors.unauthorized.code });
        return;
      }

      try {
        const orderId = String(req.params.orderId || "").trim();
        if (!orderId) {
          res.status(ApiErrors.invalidRequest.status).json({ error: ApiErrors.invalidRequest.message, code: ApiErrors.invalidRequest.code });
          return;
        }

        const payload = validateTransitionBody(req.body ?? {});
        const result = await useCases.transitionOrderStatus({
          orderId,
          toStatus: payload.toStatus,
          actorUserId: auth.userId,
          actorRole: auth.role,
          actorBranchId: auth.branchId ?? null,
          actorDisplayName: auth.displayName ?? null,
          reason: payload.reason,
          adminMessage: payload.adminMessage
        });
        res.status(200).json(result);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.serverError);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },
    async createRefundHandler(req: Request, res: Response) {
      const auth = (req as AuthRequest).auth;
      if (!auth) {
        res.status(ApiErrors.unauthorized.status).json({ error: ApiErrors.unauthorized.message, code: ApiErrors.unauthorized.code });
        return;
      }

      try {
        const orderId = String(req.params.orderId || "").trim();
        if (!orderId) {
          res.status(ApiErrors.invalidRequest.status).json({ error: ApiErrors.invalidRequest.message, code: ApiErrors.invalidRequest.code });
          return;
        }

        const payload = validateRefundBody(req.body ?? {});
        const order = await useCases.createRefund({
          orderId,
          actorUserId: auth.userId,
          actorRole: auth.role,
          actorBranchId: auth.branchId ?? null,
          actorDisplayName: auth.displayName ?? null,
          orderItemId: payload.orderItemId,
          amount: payload.amount,
          refundMethod: payload.refundMethod,
          adminMessage: payload.adminMessage
        });
        res.status(200).json({ order });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.serverError);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },
    async listCustomerOrdersHandler(req: Request, res: Response) {
      const auth = (req as AuthRequest).auth;
      if (!auth) {
        res.status(ApiErrors.unauthorized.status).json({ error: ApiErrors.unauthorized.message, code: ApiErrors.unauthorized.code });
        return;
      }

      try {
        const query = validateOrderListQuery(req.query as Record<string, unknown>);
        const result = await useCases.listCustomerOrders({
          userId: auth.userId,
          page: query.page,
          pageSize: query.pageSize
        });
        res.status(200).json({
          items: result.items,
          page: query.page,
          pageSize: query.pageSize,
          total: result.total,
          hasMore: query.page * query.pageSize < result.total
        });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.serverError);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },
    async getCustomerOrderHandler(req: Request, res: Response) {
      const auth = (req as AuthRequest).auth;
      if (!auth) {
        res.status(ApiErrors.unauthorized.status).json({ error: ApiErrors.unauthorized.message, code: ApiErrors.unauthorized.code });
        return;
      }

      try {
        const orderId = String(req.params.orderId || "").trim();
        if (!orderId) {
          res.status(ApiErrors.invalidRequest.status).json({ error: ApiErrors.invalidRequest.message, code: ApiErrors.invalidRequest.code });
          return;
        }

        const order = await useCases.getCustomerOrder({ userId: auth.userId, orderId });
        if (!order) {
          res.status(ApiErrors.checkoutOrderNotFound.status).json({ error: ApiErrors.checkoutOrderNotFound.message, code: ApiErrors.checkoutOrderNotFound.code });
          return;
        }
        res.status(200).json({ order });
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.serverError);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },
    async runExpirationSweepHandler(_req: Request, res: Response) {
      try {
        const result = await useCases.runExpirationSweep();
        res.status(200).json(result);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.serverError);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    }
  };
}
