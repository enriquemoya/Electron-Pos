import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCloudApiUrl, getCloudSecret } from "@/lib/cloud-api";

function headers() {
  const token = cookies().get("auth_access")?.value;
  return {
    authorization: token ? `Bearer ${token}` : "",
    "x-cloud-secret": getCloudSecret()
  };
}

export async function POST(_request: Request, context: { params: { id: string } }) {
  const baseUrl = getCloudApiUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "missing base url" }, { status: 500 });
  }

  const response = await fetch(`${baseUrl}/admin/blog/posts/${context.params.id}/unpublish`, {
    method: "POST",
    headers: headers(),
    cache: "no-store"
  });

  const payload = await response.text();
  return new NextResponse(payload, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") || "application/json" }
  });
}
