import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import { ApiErrors } from "../../errors/api-error";

type JwtPayload = {
  sub: string;
  role: string;
  email?: string | null;
  branchId?: string | null;
  displayName?: string | null;
};

type AuthRequest = Request & {
  auth?: {
    userId: string;
    role: string;
    email?: string | null;
    branchId?: string | null;
    displayName?: string | null;
  };
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    res.status(ApiErrors.authSessionExpired.status).json({
      error: ApiErrors.authSessionExpired.message,
      code: ApiErrors.authSessionExpired.code
    });
    return;
  }

  if (!env.jwtSecret) {
    res.status(ApiErrors.serverError.status).json({ error: ApiErrors.serverError.message, code: ApiErrors.serverError.code });
    return;
  }

  const token = header.slice(7).trim();
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (typeof decoded === "string" || !decoded) {
      res.status(ApiErrors.authSessionExpired.status).json({
        error: ApiErrors.authSessionExpired.message,
        code: ApiErrors.authSessionExpired.code
      });
      return;
    }
    const payload = decoded as JwtPayload;
    (req as AuthRequest).auth = {
      userId: payload.sub,
      role: payload.role,
      email: payload.email ?? null,
      branchId: payload.branchId ?? null,
      displayName: payload.displayName ?? null
    };
  } catch {
    res.status(ApiErrors.authSessionExpired.status).json({
      error: ApiErrors.authSessionExpired.message,
      code: ApiErrors.authSessionExpired.code
    });
    return;
  }

  next();
}
