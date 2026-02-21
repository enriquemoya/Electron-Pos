import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCloudApiUrl, getCloudSecret } from "@/lib/cloud-api";

function getHeaders() {
  const token = cookies().get("auth_access")?.value;
  return {
    authorization: token ? `Bearer ${token}` : "",
    "x-cloud-secret": getCloudSecret(),
    "content-type": "application/json"
  };
}

export async function POST(request: Request) {
  const baseUrl = getCloudApiUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "missing base url", code: "SERVER_ERROR" }, { status: 500 });
  }

  const body = await request.text();
  const response = await fetch(`${baseUrl}/admin/inventory/movements`, {
    method: "POST",
    headers: getHeaders(),
    body,
    cache: "no-store"
  });

  const payload = await response.text();
  return new NextResponse(payload, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json"
    }
  });
}
