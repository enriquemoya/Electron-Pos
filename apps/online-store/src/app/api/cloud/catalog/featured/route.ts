import { NextResponse } from "next/server";

import { getCloudApiUrl, getCloudSecret } from "@/lib/cloud-api";

export async function GET() {
  const baseUrl = getCloudApiUrl();
  const secret = getCloudSecret();

  if (!baseUrl) {
    return NextResponse.json({ error: "missing_cloud_api_url" }, { status: 500 });
  }

  try {
    const response = await fetch(`${baseUrl}/api/cloud/catalog/featured`, {
      headers: {
        "x-cloud-secret": secret
      },
      cache: "no-store"
    });
    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: "featured_proxy_failed", status: response.status, detail: text },
        { status: response.status }
      );
    }

    return new NextResponse(text, {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "upstream unavailable";
    return NextResponse.json({ error: "featured_proxy_unavailable", detail: message }, { status: 502 });
  }
}
