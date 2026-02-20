import type { Request, Response } from "express";

import { ApiErrors, asApiError } from "../../errors/api-error";
import type { PosAuthUseCases } from "../../application/use-cases/pos-auth";

type TerminalRequest = Request & {
  terminal?: { terminalId: string; branchId: string; tokenMatch: "current" | "previous" };
};

function parsePin(payload: unknown) {
  const pin = String((payload as { pin?: string })?.pin ?? "").trim();
  if (!/^\d{6}$/.test(pin)) {
    throw ApiErrors.authInvalidCredentials;
  }
  return pin;
}

export function createPosAuthController(useCases: PosAuthUseCases) {
  return {
    async loginWithPinHandler(req: Request, res: Response) {
      const context = (req as TerminalRequest).terminal;
      if (!context) {
        res.status(ApiErrors.terminalInvalidToken.status).json({
          error: ApiErrors.terminalInvalidToken.message,
          code: ApiErrors.terminalInvalidToken.code
        });
        return;
      }

      try {
        const pin = parsePin(req.body ?? {});
        const result = await useCases.loginWithPin({
          pin,
          terminalBranchId: context.branchId
        });
        res.status(200).json(result);
      } catch (error) {
        const apiError = asApiError(error, ApiErrors.authInvalidCredentials);
        res.status(apiError.status).json({ error: apiError.message, code: apiError.code });
      }
    }
  };
}

