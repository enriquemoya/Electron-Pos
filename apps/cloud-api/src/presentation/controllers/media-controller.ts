import type { Request, Response } from "express";

import type { MediaUseCases } from "../../application/use-cases/media";
import { ApiErrors, asApiError } from "../../errors/api-error";
import { validateMediaFolder } from "../../validation/media";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function getAuthUserId(req: Request) {
  return (req as Request & { auth?: { userId: string } }).auth?.userId;
}

export function createMediaController(useCases: MediaUseCases) {
  return {
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
        console.error(`[${debugId}] admin media upload failed`, {
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
    }
  };
}
