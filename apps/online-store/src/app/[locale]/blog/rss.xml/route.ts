import { getCloudApiUrl } from "@/lib/cloud-api";

export async function GET(_request: Request, context: { params: { locale: string } }) {
  const baseUrl = getCloudApiUrl();
  if (!baseUrl) {
    return new Response("missing base url", { status: 500 });
  }

  const locale = context.params.locale === "en" ? "en" : "es";
  const response = await fetch(`${baseUrl}/blog/rss?locale=${locale}`, {
    next: { revalidate: 600 }
  });

  const xml = await response.text();
  return new Response(xml, {
    status: response.status,
    headers: {
      "content-type": "application/rss+xml; charset=utf-8"
    }
  });
}
