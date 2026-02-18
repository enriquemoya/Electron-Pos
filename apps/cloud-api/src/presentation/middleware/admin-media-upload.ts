import type { NextFunction, Request, Response } from "express";
import multer from "multer";

import { ApiErrors } from "../../errors/api-error";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
}).single("file");

export function adminMediaUploadMiddleware(req: Request, res: Response, next: NextFunction) {
  upload(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(ApiErrors.mediaTooLarge.status).json({
        error: ApiErrors.mediaTooLarge.message,
        code: ApiErrors.mediaTooLarge.code
      });
      return;
    }

    const debugId = `media-mw-${Date.now().toString(36)}`;
    console.error(`[${debugId}] media upload middleware failed`, {
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(ApiErrors.invalidRequest.status).json({
      error: ApiErrors.invalidRequest.message,
      code: ApiErrors.invalidRequest.code,
      debugId
    });
  });
}
