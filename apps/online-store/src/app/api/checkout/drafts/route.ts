import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const token = cookies().get("auth_access")?.value;
  const baseUrl = process.env.CLOUD_API_URL;

  if (!token || !baseUrl) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const response = await fetch(`${baseUrl}/checkout/drafts`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cloud-secret": process.env.CLOUD_SHARED_SECRET || "",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const raw = await response.text();
  let data: unknown = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { error: raw };
    }
  }
  return NextResponse.json(data, { status: response.status });
}
