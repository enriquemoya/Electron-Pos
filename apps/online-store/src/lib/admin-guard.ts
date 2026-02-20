import "server-only";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type JwtPayload = {
  role?: string;
  branchId?: string | null;
  sub?: string;
};

function getPayload(locale: string): JwtPayload {
  const token = cookies().get("auth_access")?.value;
  if (!token) {
    redirect(`/${locale}`);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    redirect(`/${locale}`);
  }

  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    redirect(`/${locale}`);
  }
}

export function requireAdmin(locale: string) {
  const payload = getPayload(locale);
  if (payload.role !== "ADMIN") {
    redirect(`/${locale}`);
  }
  return payload;
}

export function requireAdminOrEmployee(locale: string) {
  const payload = getPayload(locale);
  if (payload.role !== "ADMIN" && payload.role !== "EMPLOYEE") {
    redirect(`/${locale}`);
  }
  return payload;
}
