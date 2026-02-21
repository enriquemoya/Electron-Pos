import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCloudApiUrl, getCloudSecret } from "@/lib/cloud-api";

export async function GET(_request: Request, context: { params: { id: string } }) {
  const baseUrl = getCloudApiUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "missing base url" }, { status: 500 });
  }

  const token = cookies().get("auth_access")?.value;
  const id = context.params.id;

  const response = await fetch(`${baseUrl}/admin/media/proofs/${id}`, {
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
