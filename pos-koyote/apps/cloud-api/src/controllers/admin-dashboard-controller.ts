import type { Request, Response } from "express";

import { ApiErrors, asApiError } from "../errors/api-error";
import { getAdminSummary } from "../services/admin-dashboard-service";

export async function getAdminSummaryHandler(_req: Request, res: Response) {
  try {
    const summary = await getAdminSummary();
    res.status(200).json(summary);
  } catch (error) {
    const apiError = asApiError(error, ApiErrors.serverError);
    res.status(apiError.status).json({ error: apiError.message });
  }
}
