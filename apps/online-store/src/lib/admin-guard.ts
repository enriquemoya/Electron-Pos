import "server-only";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type JwtPayload = {
  role?: string;
};

export function requireAdmin(locale: string) {
  const token = cookies().get("auth_access")?.value;
  if (!token) {
    redirect(`/${locale}`);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    redirect(`/${locale}`);
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    if (payload.role !== "ADMIN") {
      redirect(`/${locale}`);
    }
  } catch {
    redirect(`/${locale}`);
  }
}
