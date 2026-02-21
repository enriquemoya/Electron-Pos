import type { NextFunction, Request, Response } from "express";
import multer from "multer";

import { ApiErrors } from "../../errors/api-error";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
}).single("file");

export function posProofUploadMiddleware(req: Request, res: Response, next: NextFunction) {
  upload(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(ApiErrors.proofTooLarge.status).json({
        error: ApiErrors.proofTooLarge.message,
        code: ApiErrors.proofTooLarge.code
      });
      return;
    }

    res.status(ApiErrors.invalidRequest.status).json({
      error: ApiErrors.invalidRequest.message,
      code: ApiErrors.invalidRequest.code
    });
  });
}
