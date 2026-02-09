import { NextResponse } from "next/server";

const ALLOWED_TYPES = new Set(["games", "categories", "expansions"]);

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  if (!ALLOWED_TYPES.has(params.type)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const baseUrl = process.env.CLOUD_API_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: "missing_cloud_api_url" }, { status: 500 });
  }

  const source = new URL(`${baseUrl}/catalog/taxonomies/${params.type}`);
  const input = new URL(request.url);
  const gameId = input.searchParams.get("gameId");
  const expansionId = input.searchParams.get("expansionId");

  if (gameId) {
    source.searchParams.set("gameId", gameId);
  }
  if (expansionId && params.type === "categories") {
    source.searchParams.set("expansionId", expansionId);
  }

  try {
    const response = await fetch(source.toString(), {
      cache: "no-store"
    });
    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: "taxonomy_proxy_failed", status: response.status, detail: text },
        { status: response.status }
      );
    }

    return new NextResponse(text, {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "upstream unavailable";
    return NextResponse.json({ error: "taxonomy_proxy_unavailable", detail: message }, { status: 502 });
  }
}
