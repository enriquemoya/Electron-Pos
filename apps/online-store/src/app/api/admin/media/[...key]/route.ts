import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCloudApiUrl, getCloudSecret } from "@/lib/cloud-api";

export async function DELETE(_request: Request, context: { params: { key: string[] } }) {
  const baseUrl = getCloudApiUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "missing base url" }, { status: 500 });
  }

  const token = cookies().get("auth_access")?.value;
  const key = context.params.key.join("/");
  const encodedKey = encodeURIComponent(key);

  const response = await fetch(`${baseUrl}/admin/media/${encodedKey}`, {
    method: "DELETE",
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
