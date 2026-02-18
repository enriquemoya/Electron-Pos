import "server-only";

import { cookies } from "next/headers";

import { getCloudApiUrl, getCloudSecret } from "@/lib/cloud-api";

export type BlogPostSummary = {
  slug: string;
  locale: "es" | "en";
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  authorName: string;
  readingTimeMinutes: number;
  publishedAt: string;
  updatedAt: string;
};

export type BlogPostDetail = {
  slug: string;
  locale: "es" | "en";
  title: string;
  excerpt: string;
  contentJson: Record<string, unknown>;
  coverImageUrl: string | null;
  authorName: string;
  readingTimeMinutes: number;
  seoTitle: string;
  seoDescription: string;
  publishedAt: string;
  updatedAt: string;
};

function getBaseUrl() {
  const baseUrl = getCloudApiUrl();
  if (!baseUrl) {
    throw new Error("CLOUD_API_URL is required");
  }
  return baseUrl;
}

function getAuthHeaders() {
  const token = cookies().get("auth_access")?.value;
  if (!token) {
    throw new Error("unauthorized");
  }
  return {
    authorization: `Bearer ${token}`,
    "x-cloud-secret": getCloudSecret()
  };
}

export async function fetchPublicBlogPosts(params: {
  locale: "es" | "en";
  page: number;
  pageSize?: number;
}) {
  const url = new URL(`${getBaseUrl()}/blog/posts`);
  url.searchParams.set("locale", params.locale);
  url.searchParams.set("page", String(params.page));
  url.searchParams.set("pageSize", String(params.pageSize ?? 10));

  const response = await fetch(url.toString(), {
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    throw new Error(`blog list request failed (${response.status})`);
  }

  return response.json() as Promise<{
    items: BlogPostSummary[];
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  }>;
}

export async function fetchPublicBlogPost(params: {
  locale: "es" | "en";
  slug: string;
}) {
  const url = new URL(`${getBaseUrl()}/blog/posts/${params.slug}`);
  url.searchParams.set("locale", params.locale);

  const response = await fetch(url.toString(), {
    next: { revalidate: 300 }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`blog detail request failed (${response.status})`);
  }

  const payload = (await response.json()) as { post: BlogPostDetail };
  return payload.post;
}

export async function fetchBlogSitemapEntries(locale: "es" | "en") {
  const url = new URL(`${getBaseUrl()}/blog/sitemap`);
  url.searchParams.set("locale", locale);

  const response = await fetch(url.toString(), {
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    throw new Error(`blog sitemap request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    items: Array<{ url: string; lastModified: string }>;
  };

  return payload.items;
}

export async function fetchAdminBlogPosts(params: {
  locale?: "es" | "en";
  page?: number;
  pageSize?: number;
  query?: string;
  isPublished?: boolean;
}) {
  const url = new URL(`${getBaseUrl()}/admin/blog/posts`);
  if (params.locale) {
    url.searchParams.set("locale", params.locale);
  }
  url.searchParams.set("page", String(params.page ?? 1));
  url.searchParams.set("pageSize", String(params.pageSize ?? 20));
  if (params.query) {
    url.searchParams.set("query", params.query);
  }
  if (typeof params.isPublished === "boolean") {
    url.searchParams.set("isPublished", String(params.isPublished));
  }

  const response = await fetch(url.toString(), {
    headers: getAuthHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`admin blog list request failed (${response.status})`);
  }

  return response.json() as Promise<{
    items: Array<Record<string, unknown>>;
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  }>;
}

export async function uploadAdminMediaFile(input: { file: File; folder: "blog" }) {
  const formData = new FormData();
  formData.append("folder", input.folder);
  formData.append("file", input.file);

  const response = await fetch(`${getBaseUrl()}/admin/media/upload`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`admin media upload failed (${response.status})`);
  }

  return response.json() as Promise<{
    url: string;
    width: number;
    height: number;
    sizeBytes: number;
  }>;
}
