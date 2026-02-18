import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCloudApiUrl, getCloudSecret } from "@/lib/cloud-api";

function authHeaders() {
  const token = cookies().get("auth_access")?.value;
  return {
    authorization: token ? `Bearer ${token}` : "",
    "x-cloud-secret": getCloudSecret(),
    "content-type": "application/json"
  };
}

export async function GET(_request: Request, context: { params: { id: string } }) {
  const baseUrl = getCloudApiUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "missing base url" }, { status: 500 });
  }

  const headers = authHeaders();
  const response = await fetch(`${baseUrl}/admin/blog/posts/${context.params.id}`, {
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

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const baseUrl = getCloudApiUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "missing base url" }, { status: 500 });
  }

  const body = await request.json();
  const response = await fetch(`${baseUrl}/admin/blog/posts/${context.params.id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const payload = await response.text();
  return new NextResponse(payload, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") || "application/json" }
  });
}
