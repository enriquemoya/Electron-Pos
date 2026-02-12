import { NextRequest, NextResponse } from "next/server";
import { getPublicBaseUrl } from "@/lib/public-base-url";

const ACCESS_MAX_AGE = 0;
const REFRESH_MAX_AGE = 0;

export async function GET(request: NextRequest, { params }: { params: { locale: string } }) {
  const refreshToken = request.cookies.get("auth_refresh")?.value;
  const baseUrl = process.env.CLOUD_API_URL;

  if (refreshToken && baseUrl) {
    await fetch(`${baseUrl}/auth/logout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store"
    });
  }

  const publicBaseUrl = getPublicBaseUrl(request);
  const response = NextResponse.redirect(new URL(`/${params.locale}?logout=1`, publicBaseUrl));
  response.cookies.set("auth_access", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE
  });
  response.cookies.set("auth_refresh", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE
  });

  return response;
}
