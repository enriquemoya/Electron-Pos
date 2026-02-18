import type { NextFunction, Request, Response } from "express";
import { ApiErrors } from "../../errors/api-error";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function createRateLimitMiddleware(params: {
  limit: number;
  windowMs: number;
  keyPrefix: string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = (req as Request & { auth?: { userId?: string } }).auth;
    const actor = auth?.userId || req.ip || "unknown";
    const key = `${params.keyPrefix}:${actor}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || now >= current.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + params.windowMs });
      next();
      return;
    }

    if (current.count >= params.limit) {
      res.status(ApiErrors.blogRateLimited.status).json({
        error: ApiErrors.blogRateLimited.message,
        code: ApiErrors.blogRateLimited.code
      });
      return;
    }

    current.count += 1;
    buckets.set(key, current);
    next();
  };
}
