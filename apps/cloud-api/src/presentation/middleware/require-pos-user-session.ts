import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import { ApiErrors } from "../../errors/api-error";

type PosUserJwtPayload = {
  sub: string;
  role: string;
  branchId?: string | null;
  displayName?: string | null;
};

type PosUserRequest = Request & {
  posUser?: {
    userId: string;
    role: "ADMIN" | "EMPLOYEE";
    branchId: string | null;
    displayName: string | null;
  };
};

export function requirePosAdminSession(req: Request, res: Response, next: NextFunction) {
  const header = req.header("x-pos-user-auth") ?? req.header("x-pos-user-token");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    res.status(ApiErrors.authSessionExpired.status).json({
      error: ApiErrors.authSessionExpired.message,
      code: ApiErrors.authSessionExpired.code
    });
    return;
  }

  if (!env.jwtSecret) {
    res.status(ApiErrors.serverError.status).json({
      error: ApiErrors.serverError.message,
      code: ApiErrors.serverError.code
    });
    return;
  }

  try {
    const decoded = jwt.verify(header.slice(7).trim(), env.jwtSecret);
    if (!decoded || typeof decoded === "string") {
      throw new Error("invalid token");
    }

    const payload = decoded as PosUserJwtPayload;
    const role = payload.role === "ADMIN" ? "ADMIN" : payload.role === "EMPLOYEE" ? "EMPLOYEE" : null;
    if (!role) {
      throw new Error("invalid role");
    }
    if (role !== "ADMIN") {
      res.status(ApiErrors.rbacForbidden.status).json({
        error: ApiErrors.rbacForbidden.message,
        code: ApiErrors.rbacForbidden.code
      });
      return;
    }

    (req as PosUserRequest).posUser = {
      userId: payload.sub,
      role,
      branchId: payload.branchId ?? null,
      displayName: payload.displayName ?? null
    };

    next();
  } catch {
    res.status(ApiErrors.authSessionExpired.status).json({
      error: ApiErrors.authSessionExpired.message,
      code: ApiErrors.authSessionExpired.code
    });
  }
}
