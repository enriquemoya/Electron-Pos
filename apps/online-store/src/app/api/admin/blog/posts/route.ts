import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCloudApiUrl, getCloudSecret } from "@/lib/cloud-api";

function buildHeaders() {
  const token = cookies().get("auth_access")?.value;
  return {
    authorization: token ? `Bearer ${token}` : "",
    "x-cloud-secret": getCloudSecret(),
    "content-type": "application/json"
  };
}

export async function GET(request: Request) {
  const baseUrl = getCloudApiUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "missing base url" }, { status: 500 });
  }
  const url = new URL(`${baseUrl}/admin/blog/posts`);
  const source = new URL(request.url);
  source.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers = buildHeaders();
  const response = await fetch(url.toString(), {
    headers: {
      authorization: headers.authorization,
      "x-cloud-secret": headers["x-cloud-secret"]
    },
    cache: "no-store"
  });

  const payload = await response.text();
  return new NextResponse(payload, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") || "application/json" }
  });
}

export async function POST(request: Request) {
  const baseUrl = getCloudApiUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "missing base url" }, { status: 500 });
  }

  const body = await request.json();
  const response = await fetch(`${baseUrl}/admin/blog/posts`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const payload = await response.text();
  return new NextResponse(payload, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") || "application/json" }
  });
}
