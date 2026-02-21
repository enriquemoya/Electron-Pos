import type { Request, Response } from "express";

import { appLogger } from "../../config/app-logger";
import type { MediaUseCases } from "../../application/use-cases/media";
import { ApiErrors, asApiError } from "../../errors/api-error";
import { validateMediaFolder, validateMediaKey, validateMediaListQuery, validateProofListQuery } from "../../validation/media";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const PROOF_ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function getAuthUserId(req: Request) {
  return (req as Request & { auth?: { userId: string } }).auth?.userId;
}

export function createMediaController(useCases: MediaUseCases) {
  return {
    async uploadPosProofHandler(req: Request, res: Response) {
      const terminal = (req as Request & { terminal?: { terminalId: string; branchId: string } }).terminal;
      if (!terminal?.terminalId || !terminal.branchId) {
        res.status(ApiErrors.proofNotAuthorized.status).json({
          error: ApiErrors.proofNotAuthorized.message,
          code: ApiErrors.proofNotAuthorized.code
        });
        return;
      }

      try {
        const file = (req as Request & { file?: Express.Multer.File }).file;
        if (!file || !file.buffer || !file.mimetype) {
          throw ApiErrors.invalidRequest;
        }
        if (!PROOF_ALLOWED_MIME.has(file.mimetype)) {
          throw ApiErrors.proofInvalidType;
        }
        const saleIdRaw = req.body?.saleId;
        const saleId = typeof saleIdRaw === "string" && saleIdRaw.trim().length > 0 ? saleIdRaw.trim() : null;
        const result = await useCases.uploadPosProofMedia({
          branchId: terminal.branchId,
          terminalId: terminal.terminalId,
          saleId,
          fileBuffer: file.buffer,
          mimeType: file.mimetype
        });
        res.status(201).json(result);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.proofUploadFailed);
        res.status(apiError.status).json({
          error: apiError.message,
          code: apiError.code
        });
      }
    },
    async listAdminProofsHandler(req: Request, res: Response) {
      const actorUserId = getAuthUserId(req);
      if (!actorUserId) {
        res.status(ApiErrors.proofNotAuthorized.status).json({
          error: ApiErrors.proofNotAuthorized.message,
          code: ApiErrors.proofNotAuthorized.code
        });
        return;
      }
      try {
        const query = validateProofListQuery(req.query);
        const result = await useCases.listAdminProofMedia(query);
        res.status(200).json(result);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.proofUploadFailed);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },
    async getAdminProofByIdHandler(req: Request, res: Response) {
      const actorUserId = getAuthUserId(req);
      if (!actorUserId) {
        res.status(ApiErrors.proofNotAuthorized.status).json({
          error: ApiErrors.proofNotAuthorized.message,
          code: ApiErrors.proofNotAuthorized.code
        });
        return;
      }
      try {
        const id = String(req.params.id || "");
        const result = await useCases.getAdminProofMediaById(id);
        res.status(200).json(result);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.proofNotFound);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    },
    async listAdminMediaHandler(req: Request, res: Response) {
      const actorUserId = getAuthUserId(req);
      if (!actorUserId) {
        res.status(ApiErrors.mediaUnauthorized.status).json({
          error: ApiErrors.mediaUnauthorized.message,
          code: ApiErrors.mediaUnauthorized.code
        });
        return;
      }

      try {
        const query = validateMediaListQuery({
          folder: req.query.folder,
          page: req.query.page,
          pageSize: req.query.pageSize
        });
        const result = await useCases.listAdminMedia(query);
        res.status(200).json(result);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.mediaUploadFailed);
        res.status(apiError.status).json({
          error: apiError.message,
          code: apiError.code
        });
      }
    },
    async uploadAdminMediaHandler(req: Request, res: Response) {
      const actorUserId = getAuthUserId(req);
      if (!actorUserId) {
        res.status(ApiErrors.mediaUnauthorized.status).json({
          error: ApiErrors.mediaUnauthorized.message,
          code: ApiErrors.mediaUnauthorized.code
        });
        return;
      }

      try {
        const folder = validateMediaFolder(req.body?.folder);
        const file = (req as Request & { file?: Express.Multer.File }).file;
        if (!file || !file.buffer || !file.mimetype) {
          throw ApiErrors.invalidRequest;
        }

        if (!ALLOWED_MIME.has(file.mimetype)) {
          throw ApiErrors.mediaInvalidType;
        }

        const result = await useCases.uploadAdminMedia({
          actorUserId,
          folder,
          fileBuffer: file.buffer,
          mimeType: file.mimetype
        });

        res.status(201).json(result);
      } catch (error) {
        const debugId = `media-${Date.now().toString(36)}`;
        appLogger.error("admin media upload failed", {
          debugId,
          folder: req.body?.folder,
          mimeType: (req as Request & { file?: Express.Multer.File }).file?.mimetype,
          size: (req as Request & { file?: Express.Multer.File }).file?.size,
          error: error instanceof Error ? error.message : String(error)
        });
        const apiError = asApiError(error, ApiErrors.mediaUploadFailed);
        res.status(apiError.status).json({
          error: apiError.message,
          code: apiError.code,
          debugId
        });
      }
    },
    async deleteAdminMediaHandler(req: Request, res: Response) {
      const actorUserId = getAuthUserId(req);
      if (!actorUserId) {
        res.status(ApiErrors.mediaUnauthorized.status).json({
          error: ApiErrors.mediaUnauthorized.message,
          code: ApiErrors.mediaUnauthorized.code
        });
        return;
      }

      try {
        const rawKey = typeof req.params?.key === "string" ? req.params.key : req.params?.[0];
        const key = validateMediaKey(rawKey);
        const result = await useCases.deleteAdminMediaByKey({ key, actorUserId });
        res.status(200).json(result);
      } catch (error) {
        const debugId = `media-del-${Date.now().toString(36)}`;
        appLogger.warn("admin media delete failed", {
          debugId,
          key: req.params.key,
          actorUserId,
          error: error instanceof Error ? error.message : String(error)
        });
        const apiError = asApiError(error, ApiErrors.mediaDeleteFailed);
        res.status(apiError.status).json({
          error: apiError.message,
          code: apiError.code,
          debugId
        });
      }
    }
  };
}
