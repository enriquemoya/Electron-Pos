import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCloudApiUrl, getCloudSecret } from "@/lib/cloud-api";

function getAuthHeaders() {
  const token = cookies().get("auth_access")?.value;
  return {
    authorization: token ? `Bearer ${token}` : "",
    "x-cloud-secret": getCloudSecret()
  };
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const baseUrl = getCloudApiUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "missing base url" }, { status: 500 });
  }

  const response = await fetch(`${baseUrl}/admin/terminals/${params.id}/revoke`, {
    method: "POST",
    headers: getAuthHeaders(),
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
