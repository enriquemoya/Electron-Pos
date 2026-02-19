import type { MetadataRoute } from "next";

import { fetchBlogSitemapEntries } from "@/lib/blog-api";
import { getSiteUrl } from "@/lib/site-url";
import { BRAND_CONFIG } from "@/config/brand-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl(BRAND_CONFIG.siteUrl);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/es`, lastModified: new Date() },
    { url: `${siteUrl}/en`, lastModified: new Date() },
    { url: `${siteUrl}/es/blog`, lastModified: new Date() },
    { url: `${siteUrl}/en/blog`, lastModified: new Date() }
  ];

  const [esBlog, enBlog] = await Promise.all([
    fetchBlogSitemapEntries("es").catch(() => []),
    fetchBlogSitemapEntries("en").catch(() => [])
  ]);

  const blogEntries = [...esBlog, ...enBlog].map((item) => ({
    url: item.url,
    lastModified: item.lastModified
  }));

  return [...staticEntries, ...blogEntries];
}
