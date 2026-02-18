import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCloudApiUrl, getCloudSecret } from "@/lib/cloud-api";

export async function POST(request: Request) {
  const baseUrl = getCloudApiUrl();
  if (!baseUrl) {
    return NextResponse.json({ error: "missing base url" }, { status: 500 });
  }

  const token = cookies().get("auth_access")?.value;
  const formData = await request.formData();

  const response = await fetch(`${baseUrl}/admin/media/upload`, {
    method: "POST",
    headers: {
      authorization: token ? `Bearer ${token}` : "",
      "x-cloud-secret": getCloudSecret()
    },
    body: formData,
    cache: "no-store"
  });

  const payload = await response.text();
  return new NextResponse(payload, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") || "application/json" }
  });
}
