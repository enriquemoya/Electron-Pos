import type { Request, Response } from "express";

import { ApiErrors, asApiError } from "../errors/api-error";
import { isPositiveNumber, parsePage } from "../validation/common";
import {
  acknowledgeEvents,
  createOrder,
  getPendingEvents,
  readProducts,
  recordEvents
} from "../services/sync-service";

export async function recordEventsHandler(req: Request, res: Response) {
  const events = Array.isArray(req.body?.events) ? req.body.events : [];
  if (events.length === 0) {
    res.status(400).json({ error: ApiErrors.eventsRequired.message });
    return;
  }

  try {
    const result = await recordEvents(events);
    res.status(200).json(result);
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.invalidRequest);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function getPendingHandler(req: Request, res: Response) {
  const posId = String(req.query.posId || "");
  const since = req.query.since ? String(req.query.since) : null;
  if (!posId) {
    res.status(400).json({ error: ApiErrors.posIdRequired.message });
    return;
  }

  try {
    const events = await getPendingEvents(posId, since);
    res.status(200).json({ events });
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.serverError);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function acknowledgeHandler(req: Request, res: Response) {
  const posId = req.body?.posId;
  const eventIds = Array.isArray(req.body?.eventIds) ? req.body.eventIds : [];
  if (!posId || eventIds.length === 0) {
    res.status(400).json({ error: ApiErrors.posAckRequired.message });
    return;
  }

  try {
    await acknowledgeEvents(posId, eventIds);
    res.status(200).json({ acknowledged: eventIds });
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.serverError);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function createOrderHandler(req: Request, res: Response) {
  const orderId = req.body?.orderId;
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!orderId || items.length === 0) {
    res.status(400).json({ error: ApiErrors.orderRequired.message });
    return;
  }

  try {
    const result = await createOrder(String(orderId), items);
    if (result.duplicate) {
      res.status(200).json({ status: "duplicate" });
    } else {
      res.status(201).json({ status: "created" });
    }
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.serverError);
    res.status(apiError.status).json({ error: apiError.message });
  }
}

export async function readProductsHandler(req: Request, res: Response) {
  const page = parsePage(req.query.page, 1);
  const pageSize = parsePage(req.query.pageSize, 24);
  const id = req.query.id ? String(req.query.id) : null;

  if (!isPositiveNumber(page) || !isPositiveNumber(pageSize)) {
    res.status(400).json({ error: ApiErrors.invalidPagination.message });
    return;
  }

  try {
    const result = await readProducts(page, pageSize, id);
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
}
