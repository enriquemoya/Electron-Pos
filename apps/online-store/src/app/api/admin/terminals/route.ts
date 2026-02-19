import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCloudApiUrl, getCloudSecret } from "@/lib/cloud-api";

function getAuthHeaders(includeContentType = false) {
  const token = cookies().get("auth_access")?.value;
  const headers: Record<string, string> = {
    authorization: token ? `Bearer ${token}` : "",
    "x-cloud-secret": getCloudSecret()
  };

  if (includeContentType) {
    headers["content-type"] = "application/json";
  }

  return headers;
}

export async function GET(request: Request) {
  const baseUrl = getCloudApiUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "missing base url" }, { status: 500 });
  }

  const source = new URL(request.url);
  const target = new URL(`${baseUrl}/admin/terminals`);
  source.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  const response = await fetch(target.toString(), {
    headers: getAuthHeaders(false),
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

export async function POST(request: Request) {
  const baseUrl = getCloudApiUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "missing base url" }, { status: 500 });
  }

  const body = await request.json();
  const response = await fetch(`${baseUrl}/admin/terminals`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(body),
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
