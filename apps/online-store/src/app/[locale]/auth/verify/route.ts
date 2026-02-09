import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

export async function GET(request: Request, { params }: { params: { locale: string } }) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") ?? "";

  if (!token) {
    return NextResponse.redirect(new URL(`/${params.locale}/auth/login?error=invalid`, request.url));
  }

  const baseUrl = process.env.CLOUD_API_URL;
  if (!baseUrl) {
    return NextResponse.redirect(new URL(`/${params.locale}/auth/login?error=server`, request.url));
  }

  const response = await fetch(`${baseUrl}/auth/magic-link/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
    cache: "no-store"
  });

  if (!response.ok) {
    return NextResponse.redirect(new URL(`/${params.locale}/auth/login?error=invalid`, request.url));
  }

  const data = (await response.json()) as { accessToken: string; refreshToken: string };
  let redirectPath = `/${params.locale}`;
  const secret = process.env.JWT_SECRET;
  if (secret) {
    try {
      const payload = jwt.verify(data.accessToken, secret) as { role?: string };
      if (payload.role === "ADMIN") {
        redirectPath = `/${params.locale}/admin/home`;
      }
    } catch {
      // ignore and fall back to default redirect
    }
  }

  const result = NextResponse.redirect(new URL(redirectPath, request.url));
  result.cookies.set("auth_access", data.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE
  });
  result.cookies.set("auth_refresh", data.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE
  });

  return result;
}
