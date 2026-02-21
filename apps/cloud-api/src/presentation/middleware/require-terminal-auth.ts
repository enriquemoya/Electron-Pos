import type { NextFunction, Request, Response } from "express";

import { ApiErrors, asApiError } from "../../errors/api-error";
import type { TerminalUseCases } from "../../application/use-cases/terminals";

type TerminalRequest = Request & {
  terminal?: {
    terminalId: string;
    branchId: string;
    tokenMatch: "current" | "previous";
  };
};

export function requireTerminalAuth(useCases: TerminalUseCases) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.header("authorization");
    if (!header || !header.toLowerCase().startsWith("bearer ")) {
      res.status(ApiErrors.terminalInvalidToken.status).json({
        error: ApiErrors.terminalInvalidToken.message,
        code: ApiErrors.terminalInvalidToken.code
      });
      return;
    }

    const token = header.slice(7).trim();
    if (!token) {
      res.status(ApiErrors.terminalInvalidToken.status).json({
        error: ApiErrors.terminalInvalidToken.message,
        code: ApiErrors.terminalInvalidToken.code
      });
      return;
    }

    try {
      const context = await useCases.authenticateToken(token);
      (req as TerminalRequest).terminal = context;
      next();
    } catch (error) {
      const apiError = asApiError(error, ApiErrors.terminalInvalidToken);
      res.status(apiError.status).json({
        error: apiError.message,
        code: apiError.code
      });
    }
  };
}
