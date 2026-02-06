import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";

type JwtPayload = {
  sub: string;
  role: string;
  email?: string | null;
};

type AuthRequest = Request & { auth?: { userId: string; role: string; email?: string | null } };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const token = header.slice(7).trim();
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    (req as AuthRequest).auth = {
      userId: payload.sub,
      role: payload.role,
      email: payload.email ?? null
    };
  } catch {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  next();
}
