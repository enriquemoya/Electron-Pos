import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCloudApiUrl, getCloudSecret } from "@/lib/cloud-api";

export async function GET(request: Request) {
  const baseUrl = getCloudApiUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "missing base url" }, { status: 500 });
  }

  const token = cookies().get("auth_access")?.value;
  const currentUrl = new URL(request.url);
  const target = new URL(`${baseUrl}/admin/media/proofs`);
  currentUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  const response = await fetch(target.toString(), {
    headers: {
      authorization: token ? `Bearer ${token}` : "",
      "x-cloud-secret": getCloudSecret()
    },
    cache: "no-store"
  });

  const payload = await response.text();
  return new NextResponse(payload, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") || "application/json" }
  });
}
